use once_cell::sync::Lazy;
use tiktoken_rs::{CoreBPE, o200k_base};

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

pub fn count_prompt_tokens(prompt: &str) -> AppResult<usize> {
    let bpe = get_bpe_tokenizer()
        .ok_or_else(|| AppError::TokenizerError("BPE tokenizer not available".to_string()))?;

    Ok(bpe.encode_ordinary(prompt).len())
}
