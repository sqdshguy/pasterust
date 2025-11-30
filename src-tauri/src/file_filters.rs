use std::path::Path;

pub fn is_known_binary_extension(path: &Path) -> bool {
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

pub fn is_source_file(path: &Path) -> bool {
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
        is_special_source_file(path)
    }
}

fn is_special_source_file(path: &Path) -> bool {
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

pub fn should_skip_directory(dir_name: &str) -> bool {
    matches!(
        dir_name,
        "node_modules"
            | ".git"
            | ".svn"
            | ".hg"
            | "target"
            | "build"
            | "dist"
            | ".next"
            | ".nuxt"
            | "__pycache__"
            | ".pytest_cache"
            | ".mypy_cache"
            | "venv"
            | "env"
            | ".env"
            | ".venv"
            | ".tox"
            | ".vscode"
            | ".idea"
            | "bin"
            | "obj"
            | ".packages"
            | "vendor"
            | "deps"
            | "_build"
            | "out"
            | "coverage"
            | "logs"
            | "log"
            | "tmp"
            | "temp"
            | "cache"
            | ".cache"
            | ".gradle"
            | ".settings"
            | ".terraform"
            | ".serverless"
            | ".parcel-cache"
            | ".yarn"
            | ".pnp"
            | ".history"
            | ".DS_Store"
            | ".AppleDouble"
            | ".Trashes"
            | ".sass-cache"
            | ".bundle"
            | ".cabal-sandbox"
            | ".stack-work"
            | ".eggs"
            | ".ipynb_checkpoints"
            | ".Rproj.user"
            | ".metadata"
            | ".classpath"
            | ".project"
            | ".externalToolBuilders"
            | ".idea_modules"
            | ".nb-gradle"
            | ".nb-build"
            | ".nbproject"
            | ".vagrant"
            | ".circleci"
            | ".github"
            | ".gitlab"
            | ".hgstore"
            | ".svn-base"
            | ".svn-work"
            | ".svn-pristine"
    )
}

pub fn is_likely_binary(path: &Path) -> bool {
    is_known_binary_extension(path)
}
