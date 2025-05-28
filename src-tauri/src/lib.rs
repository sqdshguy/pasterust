use std::fs;
use std::path::Path;
use std::collections::HashMap;
use std::time::Instant;
use walkdir::WalkDir;
use serde::{Deserialize, Serialize};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tiktoken_rs::{o200k_base, CoreBPE};
use once_cell::sync::Lazy;
use rayon::prelude::*;
use memmap2::Mmap;
use simdutf8::basic::from_utf8;

// Lazy static BPE instance - initialized once, handle errors during init
static BPE_TOKENIZER: Lazy<Option<CoreBPE>> = Lazy::new(|| {
    match o200k_base() {
        Ok(bpe) => {
            println!("✅ BPE tokenizer initialized successfully");
            Some(bpe)
        }
        Err(e) => {
            eprintln!("❌ Error initializing BPE tokenizer: {:?}. Token counting will be disabled.", e);
            None
        }
    }
});

/// Get a static reference to the BPE tokenizer
fn get_bpe_tokenizer() -> Option<&'static CoreBPE> {
    BPE_TOKENIZER.as_ref()
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    name: String,
    path: String,
    is_directory: bool,
    children: Option<Vec<FileNode>>,
    is_source_file: bool,
    token_count: Option<usize>,
}

#[tauri::command]
async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let (tx, rx) = tokio::sync::oneshot::channel();
    
    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let _ = tx.send(folder_path);
        });
    
    match rx.await {
        Ok(Some(path)) => Ok(Some(path.to_string())),
        Ok(None) => Ok(None),
        Err(_) => Err("Failed to receive folder selection".to_string()),
    }
}

fn is_known_binary_extension(path: &Path) -> bool {
    if let Some(extension) = path.extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        matches!(ext.as_str(),
            "exe" | "dll" | "so" | "dylib" | "bin" | "obj" | "o" | "a" | "lib" |
            "zip" | "tar" | "gz" | "bz2" | "xz" | "7z" | "rar" | "iso" |
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "ico" | "tiff" | "webp" |
            "mp3" | "mp4" | "avi" | "mov" | "wmv" | "flv" | "mkv" | "webm" |
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" |
            "wasm" | "pyc" | "pyo" | "class" | "jar" | "war" | "ear"
        )
    } else {
        false
    }
}

fn is_source_file(path: &Path) -> bool {
    // Quick check for known binary extensions
    if is_known_binary_extension(path) {
        return false;
    }
    
    if let Some(extension) = path.extension() {
        let ext = extension.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), 
            "rs" | "py" | "js" | "ts" | "jsx" | "tsx" | "java" | "cpp" | "c" | "h" | "hpp" |
            "cs" | "php" | "rb" | "go" | "swift" | "kt" | "scala" | "clj" | "hs" | "ml" |
            "elm" | "dart" | "lua" | "r" | "m" | "mm" | "pl" | "sh" | "bash" | "zsh" |
            "fish" | "ps1" | "bat" | "cmd" | "vb" | "vbs" | "f90" | "f95" | "f03" | "f08" |
            "html" | "css" | "scss" | "sass" | "less" | "vue" | "svelte" | "json" | "xml" |
            "yaml" | "yml" | "toml" | "ini" | "cfg" | "conf" | "md" | "rst" | "tex" |
            "sql" | "graphql" | "gql" | "proto" | "thrift" | "avro" | "dockerfile" |
            "makefile" | "cmake" | "gradle" | "maven" | "sbt" | "cabal" | "stack"
        )
    } else {
        // Check for files without extensions that are commonly source files
        if let Some(filename) = path.file_name() {
            let name = filename.to_string_lossy().to_lowercase();
            matches!(name.as_str(), 
                "dockerfile" | "makefile" | "rakefile" | "gemfile" | "podfile" |
                "vagrantfile" | "gulpfile" | "gruntfile" | "webpack.config" |
                "rollup.config" | "vite.config" | "jest.config" | "babel.config"
            )
        } else {
            false
        }
    }
}

fn should_skip_directory(dir_name: &str) -> bool {
    matches!(dir_name,
        "node_modules" | ".git" | ".svn" | ".hg" | "target" | "build" | "dist" |
        ".next" | ".nuxt" | "__pycache__" | ".pytest_cache" | ".mypy_cache" |
        "venv" | "env" | ".env" | ".vscode" | ".idea" | "bin" | "obj" |
        "packages" | ".packages" | "vendor" | "deps" | "_build"
    )
}

// Maximum file size to process for token counting (10MB)
const MAX_FILE_SIZE: u64 = 10 * 1024 * 1024;
// Threshold for small files to use read_to_string (8KB)
const SMALL_FILE_SIZE: u64 = 8 * 1024;

/// Fast binary detection using only file extension.
/// Content-based detection removed for performance and simplicity.
fn is_likely_binary(path: &Path) -> bool {
    is_known_binary_extension(path)
}

/// Optimized token counting using memory mapping or read_to_string for small files
/// Avoids string allocation and UTF-8 validation overhead for valid UTF-8 files
fn count_tokens_adaptive(file_path: &std::path::Path, metadata: &fs::Metadata) -> Option<usize> {
    // Skip files that are too large or likely binary
    if metadata.len() > MAX_FILE_SIZE || is_likely_binary(file_path) {
        return None;
    }
    if metadata.len() <= SMALL_FILE_SIZE {
        // Small file: use read_to_string
        match fs::read_to_string(file_path) {
            Ok(content) => {
                let bpe = get_bpe_tokenizer()?;
                let tokens = bpe.encode_with_special_tokens(&content);
                Some(tokens.len())
            }
            Err(_) => None,
        }
    } else {
        // Large file: use mmap
        let file = match fs::File::open(file_path) {
            Ok(file) => file,
            Err(_) => return None,
        };
        let mmap = match unsafe { Mmap::map(&file) } {
            Ok(mmap) => mmap,
            Err(_) => return None,
        };
        match from_utf8(&mmap) {
            Ok(content) => {
                let bpe = get_bpe_tokenizer()?;
                let tokens = bpe.encode_with_special_tokens(content);
                Some(tokens.len())
            }
            Err(_) => None,
        }
    }
}

#[tauri::command]
fn scan_directory(folder_path: String) -> Result<Vec<FileNode>, String> {
    use std::path::PathBuf;
    let start_time = Instant::now();
    println!("🔍 Starting directory scan for: {}", folder_path);
    let path = std::path::Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory path".to_string());
    }
    // First pass: collect all entries and prepare for parallel processing
    let scan_start = Instant::now();
    let mut all_entries = Vec::new();
    let mut source_file_entries = Vec::new();
    for entry in WalkDir::new(path)
        .max_depth(10)
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
        match entry {
            Ok(entry) => {
                // Fetch metadata first to avoid extra syscalls
                let metadata = match entry.metadata() {
                    Ok(m) => m,
                    Err(_) => continue,
                };
                let file_type = metadata.file_type();
                let is_dir = file_type.is_dir();
                let entry_path: PathBuf = entry.path().to_path_buf();
                // Skip the root directory itself
                if entry_path == path {
                    continue;
                }
                let is_source = if is_dir { false } else { is_source_file(&entry_path) };
                // Use into_owned() for efficient OsStr to String conversion
                all_entries.push((
                    entry.file_name().to_string_lossy().into_owned(),
                    entry_path.clone(),
                    is_dir,
                    is_source,
                    metadata.clone(),
                ));
                // Collect source files that need token counting
                if is_source && !is_dir && metadata.len() <= MAX_FILE_SIZE && !is_likely_binary(&entry_path) {
                    source_file_entries.push((entry_path.clone(), metadata.clone()));
                }
            }
            Err(_) => continue,
        }
    }
    let scan_elapsed = scan_start.elapsed();
    println!("📂 Directory walking completed in {:.2?} - found {} entries, {} source files", 
             scan_elapsed, all_entries.len(), source_file_entries.len());
    // Parallel processing: count tokens for all source files using adaptive method
    let token_start = Instant::now();
    let token_counts: HashMap<PathBuf, Option<usize>> = source_file_entries
        .par_iter()
        .map(|(file_path, metadata)| {
            let token_count = count_tokens_adaptive(file_path, metadata);
            (file_path.clone(), token_count)
        })
        .collect();
    let token_elapsed = token_start.elapsed();
    let total_tokens: usize = token_counts.values().filter_map(|&count| count).sum();
    println!("🔢 Token counting completed in {:.2?} - processed {} files, {} total tokens", 
             token_elapsed, source_file_entries.len(), total_tokens);
    // Second pass: build nodes with computed token counts
    let build_start = Instant::now();
    let mut path_to_node: HashMap<PathBuf, FileNode> = HashMap::new();
    for (name, path_buf, is_dir, is_source, _) in all_entries {
        let token_count = if is_source && !is_dir {
            token_counts.get(&path_buf).copied().flatten()
        } else {
            None
        };
        let node = FileNode {
            name,
            path: path_buf.to_string_lossy().to_string(),
            is_directory: is_dir,
            children: if is_dir { Some(Vec::new()) } else { None },
            is_source_file: is_source,
            token_count,
        };
        path_to_node.insert(path_buf, node);
    }
    // Third pass: build the tree structure (O(N) version)
    // Build a map: parent_path → Vec<FileNode>
    let mut parent_map: HashMap<PathBuf, Vec<FileNode>> = HashMap::with_capacity(path_to_node.len());
    for (path_buf, node) in &path_to_node {
        let parent = path_buf.parent().map(|p| p.to_path_buf()).unwrap_or_else(|| PathBuf::new());
        parent_map.entry(parent).or_default().push(node.clone());
    }
    // Recursively assemble starting from root
    fn assemble(parent: &Path, map: &HashMap<PathBuf, Vec<FileNode>>) -> Vec<FileNode> {
        map.get(parent)
            .cloned()
            .unwrap_or_default()
            .into_iter()
            .map(|mut node| {
                if node.is_directory {
                    let node_path = PathBuf::from(&node.path);
                    node.children = Some(assemble(&node_path, map));
                }
                node
            })
            .collect()
    }
    let mut root_children = assemble(path, &parent_map);
    let build_elapsed = build_start.elapsed();
    println!("🌳 Tree building completed in {:.2?} - created {} root nodes", 
             build_elapsed, root_children.len());
    // Recursive function to sort children at all levels
    let sort_start = Instant::now();
    fn sort_children(node: &mut FileNode) {
        if let Some(ref mut children) = node.children {
            children.sort_by(|a, b| {
                // Directories first, then files, both sorted alphabetically
                match (a.is_directory, b.is_directory) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                }
            });
            for child in children.iter_mut() {
                sort_children(child);
            }
        }
    }
    root_children.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    for child in root_children.iter_mut() {
        sort_children(child);
    }
    let sort_elapsed = sort_start.elapsed();
    let total_elapsed = start_time.elapsed();
    println!("🔄 Sorting completed in {:.2?}", sort_elapsed);
    println!("✅ Directory scan completed in {:.2?} total time", total_elapsed);
    Ok(root_children)
}

#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[tauri::command]
fn count_prompt_tokens(prompt: String) -> Result<usize, String> {
    match get_bpe_tokenizer() {
        Some(bpe) => {
            let tokens = bpe.encode_with_special_tokens(&prompt);
            Ok(tokens.len())
        }
        None => Err("BPE tokenizer not available".to_string())
    }
}

#[tauri::command]
async fn copy_to_clipboard(app: tauri::AppHandle, content: String) -> Result<(), String> {
    app.clipboard()
        .write_text(content)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            select_folder,
            scan_directory,
            read_file_content,
            copy_to_clipboard,
            count_prompt_tokens
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
