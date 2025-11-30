use memchr::memchr;
use memmap2::Mmap;
use once_cell::sync::Lazy;
use simdutf8::basic::from_utf8;
use std::fs::{self, File};
use std::path::Path;
use tiktoken_rs::{CoreBPE, o200k_base};

use crate::config::AppConfig;
use crate::error::{AppError, AppResult};

static BPE_TOKENIZER: Lazy<Option<CoreBPE>> = Lazy::new(|| match o200k_base() {
    Ok(bpe) => {
        println!("✅ BPE tokenizer initialized successfully");
        Some(bpe)
    }
    Err(e) => {
        eprintln!(
            "❌ Error initializing BPE tokenizer: {:?}. Token counting will be disabled.",
            e
        );
        None
    }
});

pub fn get_bpe_tokenizer() -> Option<&'static CoreBPE> {
    BPE_TOKENIZER.as_ref()
}

pub fn count_tokens_adaptive(
    file_path: &Path,
    metadata: &fs::Metadata,
    config: &AppConfig,
) -> AppResult<Option<usize>> {
    if !config.enable_token_counting {
        return Ok(None);
    }

    if metadata.len() > config.max_file_size {
        return Ok(None);
    }

    if metadata.len() == 0 {
        return Ok(Some(0));
    }

    let file = File::open(file_path).map_err(|e| {
        AppError::FileReadError(format!("Failed to open {}: {}", file_path.display(), e))
    })?;

    let mmap = unsafe { Mmap::map(&file) }.map_err(|e| {
        AppError::FileReadError(format!("Mmap failed {}: {}", file_path.display(), e))
    })?;

    let header_len = std::cmp::min(mmap.len(), 8192);
    let header = &mmap[..header_len];

    if is_binary_slice(header) {
        return Ok(None);
    }

    match from_utf8(&mmap) {
        Ok(content) => {
            let bpe = get_bpe_tokenizer().ok_or_else(|| {
                AppError::TokenizerError("BPE tokenizer not available".to_string())
            })?;
            let tokens = bpe.encode_ordinary(content);
            Ok(Some(tokens.len()))
        }
        Err(_) => Ok(None), // Invalid UTF-8 (binary or unsupported encoding)
    }
}

fn is_binary_slice(slice: &[u8]) -> bool {
    // Check for UTF-16 BOM (LE or BE). UTF-16 is unsupported/binary because BPE tokenizer expects UTF-8 anyway.
    if slice.len() >= 2 {
        if (slice[0] == 0xFF && slice[1] == 0xFE) || (slice[0] == 0xFE && slice[1] == 0xFF) {
            return true;
        }
    }

    // Fast NULL Check (SIMD Optimized via memchr)
    if memchr(0, slice).is_some() {
        return true;
    }

    // Heuristic: Control Characters
    // Check first 128 bytes (checking 8KB for this is overkill)
    let check_limit = std::cmp::min(slice.len(), 1024);
    let control_chars = slice[..check_limit]
        .iter()
        .filter(|&&b| (b < 32 && b != 9 && b != 10 && b != 13 && b != 12) || b == 127)
        .count();

    // If > 30% control characters, likely binary
    if check_limit > 0 && (control_chars as f32 / check_limit as f32) > 0.30 {
        return true;
    }

    false
}

pub fn count_prompt_tokens(prompt: &str) -> AppResult<usize> {
    let bpe = get_bpe_tokenizer()
        .ok_or_else(|| AppError::TokenizerError("BPE tokenizer not available".to_string()))?;

    Ok(bpe.encode_ordinary(prompt).len())
}
