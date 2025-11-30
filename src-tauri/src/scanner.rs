use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;
use ignore::WalkBuilder;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};
use crate::file_filters::{is_likely_binary, is_source_file, should_skip_directory};
use crate::tokenizer::count_tokens_adaptive;

#[cfg(feature = "parallel")]
use rayon::prelude::*;

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

        let (all_entries, source_file_entries) = self.collect_entries(path)?;
        let token_counts = self.count_tokens(&source_file_entries)?;
        let root_children = self.build_tree(path, all_entries, token_counts)?;

        let total_elapsed = start_time.elapsed();
        println!(
            "✅ Directory scan completed in {:.2?} total time",
            total_elapsed
        );

        Ok(root_children)
    }

    fn collect_entries(
        &self,
        path: &Path,
    ) -> AppResult<(Vec<EntryInfo>, Vec<(PathBuf, fs::Metadata)>)> {
        let scan_start = Instant::now();
        let mut all_entries = Vec::new();
        let mut source_file_entries = Vec::new();

        let mut builder = WalkBuilder::new(path);
        builder
            .max_depth(Some(self.config.max_depth))
            .hidden(false)
            .filter_entry(|entry| {
                if entry.depth() == 0 {
                    return true;
                }

                if entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    if let Some(name) = entry.file_name().to_str() {
                        return !should_skip_directory(name);
                    }
                }

                true
            });

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

            let is_source = if is_dir {
                false
            } else {
                is_source_file(entry_path)
            };

            if is_source
                && !is_dir
                && metadata.len() <= self.config.max_file_size
                && !is_likely_binary(entry_path)
            {
                source_file_entries.push((entry_path.to_path_buf(), metadata));
            }

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
            source_file_entries.len()
        );

        Ok((all_entries, source_file_entries))
    }

    fn count_tokens(
        &self,
        source_file_entries: &[(PathBuf, fs::Metadata)],
    ) -> AppResult<HashMap<PathBuf, Option<usize>>> {
        let token_start = Instant::now();

        let process_entry = |(path, metadata): &(PathBuf, fs::Metadata)| {
            let count = count_tokens_adaptive(path, metadata, &self.config).unwrap_or(None);
            (path.clone(), count)
        };

        let token_counts: HashMap<PathBuf, Option<usize>> =
            if self.config.enable_parallel_processing {
                #[cfg(feature = "parallel")]
                {
                    source_file_entries.par_iter().map(process_entry).collect()
                }
                #[cfg(not(feature = "parallel"))]
                {
                    source_file_entries.iter().map(process_entry).collect()
                }
            } else {
                source_file_entries.iter().map(process_entry).collect()
            };

        let token_elapsed = token_start.elapsed();
        let total_tokens: usize = token_counts.values().flatten().sum();

        println!(
            "🔢 Token counting completed in {:.2?} - processed {} files, {} total tokens",
            token_elapsed,
            source_file_entries.len(),
            total_tokens
        );

        Ok(token_counts)
    }

    fn build_tree(
        &self,
        root_path: &Path,
        all_entries: Vec<EntryInfo>,
        token_counts: HashMap<PathBuf, Option<usize>>,
    ) -> AppResult<Vec<FileNode>> {
        let build_start = Instant::now();

        let mut parent_map: HashMap<PathBuf, Vec<FileNode>> =
            HashMap::with_capacity(all_entries.len() / 2);

        for entry in all_entries {
            let token_count = if entry.is_source_file && !entry.is_directory {
                token_counts.get(&entry.path).copied().flatten()
            } else {
                None
            };

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
                token_count,
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

    fn sort_tree(&self, nodes: &mut Vec<FileNode>) {
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
