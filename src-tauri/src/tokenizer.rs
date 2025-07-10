use std::collections::HashSet;
use std::fs;
use std::path::Path;
use tiktoken_rs::{o200k_base, CoreBPE};
use once_cell::sync::Lazy;
use memmap2::Mmap;
use simdutf8::basic::from_utf8;

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};
use crate::file_filters::is_likely_binary;

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

pub fn get_bpe_tokenizer() -> Option<&'static CoreBPE> {
    BPE_TOKENIZER.as_ref()
}

pub fn count_tokens_adaptive(file_path: &Path, metadata: &fs::Metadata, config: &AppConfig) -> AppResult<Option<usize>> {
    if !config.enable_token_counting {
        return Ok(None);
    }

    if metadata.len() > config.max_file_size || is_likely_binary(file_path) {
        return Ok(None);
    }

    let bpe = get_bpe_tokenizer()
        .ok_or_else(|| AppError::TokenizerError("BPE tokenizer not available".to_string()))?;

    let empty_special_tokens: HashSet<&str> = HashSet::new();
    
    if metadata.len() <= config.small_file_size {
        count_tokens_small_file(file_path, bpe, &empty_special_tokens)
    } else {
        count_tokens_large_file(file_path, bpe, &empty_special_tokens)
    }
}

fn count_tokens_small_file(
    file_path: &Path, 
    bpe: &CoreBPE, 
    special_tokens: &HashSet<&str>
) -> AppResult<Option<usize>> {
    match fs::read_to_string(file_path) {
        Ok(content) => {
            let (tokens, _) = bpe.encode(&content, special_tokens);
            Ok(Some(tokens.len()))
        }
        Err(e) => {
            eprintln!("Failed to read file {}: {}", file_path.display(), e);
            Ok(None)
        }
    }
}

fn count_tokens_large_file(
    file_path: &Path, 
    bpe: &CoreBPE, 
    special_tokens: &HashSet<&str>
) -> AppResult<Option<usize>> {
    let file = fs::File::open(file_path)
        .map_err(|e| AppError::FileReadError(format!("Failed to open file {}: {}", file_path.display(), e)))?;
    
    let mmap = unsafe { Mmap::map(&file) }
        .map_err(|e| AppError::FileReadError(format!("Failed to memory map file {}: {}", file_path.display(), e)))?;
    
    match from_utf8(&mmap) {
        Ok(content) => {
            let (tokens, _) = bpe.encode(content, special_tokens);
            Ok(Some(tokens.len()))
        }
        Err(_) => {
            eprintln!("File {} is not valid UTF-8, skipping token counting", file_path.display());
            Ok(None)
        }
    }
}

pub fn count_prompt_tokens(prompt: &str) -> AppResult<usize> {
    let bpe = get_bpe_tokenizer()
        .ok_or_else(|| AppError::TokenizerError("BPE tokenizer not available".to_string()))?;
    
    let empty_special_tokens: HashSet<&str> = HashSet::new();
    let (tokens, _) = bpe.encode(prompt, &empty_special_tokens);
    Ok(tokens.len())
}