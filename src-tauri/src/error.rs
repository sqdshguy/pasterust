use std::fmt;

#[derive(Debug)]
pub enum AppError {
    IoError(std::io::Error),
    InvalidPath(String),
    TokenizerError(String),
    DirectoryScanError(String),
    FileReadError(String),
    ClipboardError(String),
    DialogError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO error: {}", e),
            AppError::InvalidPath(path) => write!(f, "Invalid path: {}", path),
            AppError::TokenizerError(msg) => write!(f, "Tokenizer error: {}", msg),
            AppError::DirectoryScanError(msg) => write!(f, "Directory scan error: {}", msg),
            AppError::FileReadError(msg) => write!(f, "File read error: {}", msg),
            AppError::ClipboardError(msg) => write!(f, "Clipboard error: {}", msg),
            AppError::DialogError(msg) => write!(f, "Dialog error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error)
    }
}

pub type AppResult<T> = Result<T, AppError>;

impl From<AppError> for String {
    fn from(error: AppError) -> Self {
        error.to_string()
    }
}
