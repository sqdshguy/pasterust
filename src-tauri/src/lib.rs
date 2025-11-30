use rayon::prelude::*;
use serde::Serialize;
use std::fs;
use tauri_plugin_clipboard_manager::ClipboardExt;

mod config;
mod error;
mod file_filters;
mod scanner;
mod tokenizer;

use config::DEFAULT_CONFIG;
use error::AppError;
use scanner::{DirectoryScanner, FileNode};
use tokenizer::count_prompt_tokens;

#[derive(Serialize)]
struct FileContent {
    path: String,
    content: Option<String>,
    error: Option<String>,
}

#[tauri::command]
async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let (tx, rx) = tokio::sync::oneshot::channel();

    app.dialog().file().pick_folder(move |folder_path| {
        let _ = tx.send(folder_path);
    });

    match rx.await {
        Ok(Some(path)) => Ok(Some(path.to_string())),
        Ok(None) => Ok(None),
        Err(_) => {
            Err(AppError::DialogError("Failed to receive folder selection".to_string()).into())
        }
    }
}

#[tauri::command]
fn scan_directory(folder_path: String) -> Result<Vec<FileNode>, String> {
    let scanner = DirectoryScanner::new(DEFAULT_CONFIG);
    scanner.scan_directory(&folder_path).map_err(|e| e.into())
}

#[tauri::command]
fn read_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| {
        AppError::FileReadError(format!("Failed to read file {}: {}", file_path, e)).into()
    })
}

#[tauri::command]
fn read_file_contents(file_paths: Vec<String>) -> Result<Vec<FileContent>, String> {
    let results: Vec<FileContent> = file_paths
        .into_par_iter()
        .map(|path| match fs::read_to_string(&path) {
            Ok(content) => FileContent {
                path,
                content: Some(content),
                error: None,
            },
            Err(e) => {
                let error_message: String =
                    AppError::FileReadError(format!("Failed to read file {}: {}", path, e)).into();

                FileContent {
                    path,
                    content: None,
                    error: Some(error_message),
                }
            }
        })
        .collect();

    Ok(results)
}

#[tauri::command]
fn count_prompt_tokens_command(prompt: String) -> Result<usize, String> {
    count_prompt_tokens(&prompt).map_err(|e| e.into())
}

#[tauri::command]
async fn copy_to_clipboard(app: tauri::AppHandle, content: String) -> Result<(), String> {
    app.clipboard()
        .write_text(content)
        .map_err(|e| AppError::ClipboardError(format!("Failed to copy to clipboard: {}", e)).into())
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
            read_file_contents,
            copy_to_clipboard,
            count_prompt_tokens_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
