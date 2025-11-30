use memchr::memchr;
use std::fs::File;
use std::io::Read;
use std::path::Path;

const SAMPLE_SIZE: usize = 8192;

pub fn is_likely_binary(path: &Path) -> bool {
    let mut file = match File::open(path) {
        Ok(file) => file,
        Err(_) => return false,
    };

    let mut buffer = [0u8; SAMPLE_SIZE];
    let bytes_read = match file.read(&mut buffer) {
        Ok(0) => return false,
        Ok(n) => n,
        Err(_) => return false,
    };

    let sample = &buffer[..bytes_read];

    if memchr(0, sample).is_some() {
        return true;
    }

    let non_text_bytes = sample
        .iter()
        .filter(|&&byte| matches!(byte, 0x00..=0x08 | 0x0E..=0x1F | 0x7F))
        .count();

    (non_text_bytes as f32 / bytes_read as f32) > 0.3
}
