use ignore::{DirEntry, WalkBuilder};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::Instant;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};
use crate::file_filters::is_likely_binary;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileNode>>,
    pub is_source_file: bool,
    pub token_count: Option<usize>,
}

pub struct DirectoryScanner {
    config: AppConfig,
}

const IGNORED_DIRECTORIES: [&str; 5] = ["node_modules", ".git", ".hg", ".svn", "target"];

impl DirectoryScanner {
    pub fn new(config: AppConfig) -> Self {
        Self { config }
    }

    pub fn scan_directory(&self, folder_path: &str) -> AppResult<Vec<FileNode>> {
        let start_time = Instant::now();
        println!("🔍 Starting directory scan for: {}", folder_path);

        let path = Path::new(folder_path);
        if !path.exists() || !path.is_dir() {
            return Err(AppError::InvalidPath(format!(
                "Invalid directory path: {}",
                folder_path
            )));
        }

        let all_entries = self.collect_entries(path)?;
        let root_children = self.build_tree(path, all_entries)?;

        let total_elapsed = start_time.elapsed();
        println!(
            "✅ Directory scan completed in {:.2?} total time",
            total_elapsed
        );

        Ok(root_children)
    }

    fn collect_entries(&self, path: &Path) -> AppResult<Vec<EntryInfo>> {
        let scan_start = Instant::now();
        let mut all_entries = Vec::new();

        let mut builder = WalkBuilder::new(path);
        builder
            .max_depth(Some(self.config.max_depth))
            .hidden(false)
            .filter_entry(|entry| !should_ignore_entry(entry));

        let walker = builder.build();

        for result in walker {
            let entry = result.map_err(|e| {
                AppError::DirectoryScanError(format!("Error walking directory: {}", e))
            })?;

            let entry_path = entry.path();

            if entry_path == path {
                continue;
            }

            let metadata = entry.metadata().map_err(|e| {
                AppError::DirectoryScanError(format!("Error getting metadata: {}", e))
            })?;

            let is_dir = metadata.is_dir();

            let is_binary = if is_dir {
                false
            } else {
                is_likely_binary(entry_path)
            };

            let is_source = !is_dir && !is_binary;

            all_entries.push(EntryInfo {
                name: entry.file_name().to_string_lossy().into_owned(),
                path: entry_path.to_path_buf(),
                is_directory: is_dir,
                is_source_file: is_source,
            });
        }

        let scan_elapsed = scan_start.elapsed();
        println!(
            "📂 Directory walking completed in {:.2?} - found {} entries, {} source files",
            scan_elapsed,
            all_entries.len(),
            all_entries.iter().filter(|e| e.is_source_file).count()
        );

        Ok(all_entries)
    }

    fn build_tree(
        &self,
        root_path: &Path,
        all_entries: Vec<EntryInfo>,
    ) -> AppResult<Vec<FileNode>> {
        let build_start = Instant::now();

        let mut parent_map: HashMap<PathBuf, Vec<FileNode>> =
            HashMap::with_capacity(all_entries.len() / 2);

        for entry in all_entries {
            let parent_path = entry
                .path
                .parent()
                .map(|p| p.to_path_buf())
                .unwrap_or_else(PathBuf::new);

            let node = FileNode {
                name: entry.name,
                path: entry.path.to_string_lossy().to_string(),
                is_directory: entry.is_directory,
                children: if entry.is_directory {
                    Some(Vec::new())
                } else {
                    None
                },
                is_source_file: entry.is_source_file,
                token_count: None,
            };

            parent_map.entry(parent_path).or_default().push(node);
        }

        let mut root_children = self.assemble_tree(root_path, &mut parent_map);
        self.sort_tree(&mut root_children);

        let build_elapsed = build_start.elapsed();
        println!(
            "🌳 Tree building completed in {:.2?} - created {} root nodes",
            build_elapsed,
            root_children.len()
        );

        Ok(root_children)
    }

    fn assemble_tree(
        &self,
        parent: &Path,
        map: &mut HashMap<PathBuf, Vec<FileNode>>,
    ) -> Vec<FileNode> {
        map.remove(parent)
            .unwrap_or_default()
            .into_iter()
            .map(|mut node| {
                if node.is_directory {
                    let node_path = PathBuf::from(&node.path);
                    node.children = Some(self.assemble_tree(&node_path, map));
                }
                node
            })
            .collect()
    }

    fn sort_tree(&self, nodes: &mut [FileNode]) {
        nodes.sort_unstable_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        for node in nodes.iter_mut() {
            if let Some(ref mut children) = node.children {
                self.sort_tree(children);
            }
        }
    }
}

#[derive(Debug, Clone)]
struct EntryInfo {
    name: String,
    path: PathBuf,
    is_directory: bool,
    is_source_file: bool,
}

fn should_ignore_entry(entry: &DirEntry) -> bool {
    if entry.depth() == 0 {
        return false;
    }

    let Some(file_type) = entry.file_type() else {
        return false;
    };

    let Some(name) = entry.file_name().to_str() else {
        return false;
    };

    file_type.is_dir()
        && IGNORED_DIRECTORIES
            .iter()
            .any(|ignored| name.eq_ignore_ascii_case(ignored))
}
