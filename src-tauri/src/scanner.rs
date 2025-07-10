use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;
use walkdir::WalkDir;
use serde::{Deserialize, Serialize};

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};
use crate::file_filters::{is_source_file, should_skip_directory, is_likely_binary};
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
            return Err(AppError::InvalidPath(format!("Invalid directory path: {}", folder_path)));
        }

        let (all_entries, source_file_entries) = self.collect_entries(path)?;
        let token_counts = self.count_tokens_parallel(&source_file_entries)?;
        let root_children = self.build_tree(path, all_entries, token_counts)?;

        let total_elapsed = start_time.elapsed();
        println!("✅ Directory scan completed in {:.2?} total time", total_elapsed);
        
        Ok(root_children)
    }

    fn collect_entries(&self, path: &Path) -> AppResult<(Vec<EntryInfo>, Vec<(PathBuf, fs::Metadata)>)> {
        let scan_start = Instant::now();
        let mut all_entries = Vec::new();
        let mut source_file_entries = Vec::new();

        for entry in WalkDir::new(path)
            .max_depth(self.config.max_depth)
            .into_iter()
            .filter_entry(|e| {
                if e.path().is_dir() {
                    if let Some(name) = e.file_name().to_str() {
                        !should_skip_directory(name)
                    } else {
                        true
                    }
                } else {
                    true
                }
            })
        {
            let entry = entry.map_err(|e| AppError::DirectoryScanError(format!("Error walking directory: {}", e)))?;
            
            let metadata = entry.metadata()
                .map_err(|e| AppError::DirectoryScanError(format!("Error getting metadata: {}", e)))?;
            
            let file_type = metadata.file_type();
            let is_dir = file_type.is_dir();
            let entry_path: PathBuf = entry.path().to_path_buf();
            
            if entry_path == path {
                continue;
            }

            let is_source = if is_dir { false } else { is_source_file(&entry_path) };
            
            all_entries.push(EntryInfo {
                name: entry.file_name().to_string_lossy().into_owned(),
                path: entry_path.clone(),
                is_directory: is_dir,
                is_source_file: is_source,
            });

            if is_source && !is_dir && metadata.len() <= self.config.max_file_size && !is_likely_binary(&entry_path) {
                source_file_entries.push((entry_path, metadata));
            }
        }

        let scan_elapsed = scan_start.elapsed();
        println!("📂 Directory walking completed in {:.2?} - found {} entries, {} source files", 
                 scan_elapsed, all_entries.len(), source_file_entries.len());

        Ok((all_entries, source_file_entries))
    }

    fn count_tokens_parallel(&self, source_file_entries: &[(PathBuf, fs::Metadata)]) -> AppResult<HashMap<PathBuf, Option<usize>>> {
        let token_start = Instant::now();
        
        let token_counts: HashMap<PathBuf, Option<usize>> = if self.config.enable_parallel_processing {
            #[cfg(feature = "parallel")]
            {
                source_file_entries
                    .par_iter()
                    .map(|(file_path, metadata)| {
                        let token_count = count_tokens_adaptive(file_path, metadata, &self.config)
                            .unwrap_or(None);
                        (file_path.clone(), token_count)
                    })
                    .collect()
            }
            #[cfg(not(feature = "parallel"))]
            {
                source_file_entries
                    .iter()
                    .map(|(file_path, metadata)| {
                        let token_count = count_tokens_adaptive(file_path, metadata, &self.config)
                            .unwrap_or(None);
                        (file_path.clone(), token_count)
                    })
                    .collect()
            }
        } else {
            source_file_entries
                .iter()
                .map(|(file_path, metadata)| {
                    let token_count = count_tokens_adaptive(file_path, metadata, &self.config)
                        .unwrap_or(None);
                    (file_path.clone(), token_count)
                })
                .collect()
        };

        let token_elapsed = token_start.elapsed();
        let total_tokens: usize = token_counts.values().filter_map(|&count| count).sum();
        println!("🔢 Token counting completed in {:.2?} - processed {} files, {} total tokens", 
                 token_elapsed, source_file_entries.len(), total_tokens);

        Ok(token_counts)
    }

    fn build_tree(&self, root_path: &Path, all_entries: Vec<EntryInfo>, token_counts: HashMap<PathBuf, Option<usize>>) -> AppResult<Vec<FileNode>> {
        let build_start = Instant::now();
        let mut path_to_node: HashMap<PathBuf, FileNode> = HashMap::new();
        
        for entry in all_entries {
            let token_count = if entry.is_source_file && !entry.is_directory {
                token_counts.get(&entry.path).copied().flatten()
            } else {
                None
            };

            let node = FileNode {
                name: entry.name,
                path: entry.path.to_string_lossy().to_string(),
                is_directory: entry.is_directory,
                children: if entry.is_directory { Some(Vec::new()) } else { None },
                is_source_file: entry.is_source_file,
                token_count,
            };
            path_to_node.insert(entry.path, node);
        }

        let mut parent_map: HashMap<PathBuf, Vec<FileNode>> = HashMap::with_capacity(path_to_node.len());
        for (path_buf, node) in &path_to_node {
            let parent = path_buf.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::new());
            parent_map.entry(parent).or_default().push(node.clone());
        }

        let mut root_children = self.assemble_tree(root_path, &parent_map);
        self.sort_tree(&mut root_children);

        let build_elapsed = build_start.elapsed();
        println!("🌳 Tree building completed in {:.2?} - created {} root nodes", 
                 build_elapsed, root_children.len());

        Ok(root_children)
    }

    fn assemble_tree(&self, parent: &Path, map: &HashMap<PathBuf, Vec<FileNode>>) -> Vec<FileNode> {
        map.get(parent)
            .cloned()
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
        nodes.sort_by(|a, b| {
            match (a.is_directory, b.is_directory) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
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