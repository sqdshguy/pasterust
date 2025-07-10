use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub max_file_size: u64,
    pub small_file_size: u64,
    pub max_depth: usize,
    pub enable_parallel_processing: bool,
    pub enable_token_counting: bool,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            max_file_size: 10 * 1024 * 1024, // 10MB
            small_file_size: 8 * 1024,       // 8KB
            max_depth: 10,
            enable_parallel_processing: true,
            enable_token_counting: true,
        }
    }
}

pub const DEFAULT_CONFIG: AppConfig = AppConfig {
    max_file_size: 10 * 1024 * 1024,
    small_file_size: 8 * 1024,
    max_depth: 10,
    enable_parallel_processing: true,
    enable_token_counting: true,
};