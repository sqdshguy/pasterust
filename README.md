# PasteRust – Fast context for your LLM

PasteRust is a lightweight desktop app that copies selected files (plus an optional prompt) into your clipboard so you can paste structured context directly into an LLM. This is especially useful when you have a ChatGPT/Claude subscription and want to utilize its limits to improve your projects. Also great for use with Google AI Studio.

> Benchmark: re‑indexed the TensorFlow monorepo (~1.6 GB) in **6.7 seconds** on an entry‑level i3‑10105F.

## Background

[pastemax](https://github.com/kleneway/pastemax) solved the workflow but Electron startup time did not. My version keeps the workflow while delivering a small footprint, native speed, and minimal startup delay.

## Features

- Fast startup: point at a repository and start working in seconds.
- Automatic file detection: files are picked up without manual curation.
- Selective copy: choose only the files you need.
- Optional prompt: add contextual instructions alongside the files.
- XML output: structured and easily readable for LLMs.
- Native UI: built with Tauri (React and Rust).

## Workflow

1. Select a folder.
2. Review detected files.
3. Select the files to include.
4. (Optional) Add a custom prompt.
5. Copy the generated XML prompt.

Prompt structure (mirrors the "Standard" preset from RepoPrompt - credit to them for the format and research):
```xml
<file_map>
/path/to/project
├── src
│   ├── main.rs *
│   └── lib.rs
└── Cargo.toml
</file_map>
<file_contents>
File: /path/to/project/src/main.rs
```rs
fn main() {}
```
</file_contents>
<user_instructions>
Refactor for async/await best practices.
</user_instructions>
```

## Stack

- Frontend: React, TypeScript, Vite.
- Runtime: Rust.
- Host: Tauri.
- File system crawl: ignore crate (parallel traversal).
- Clipboard: Tauri plugin (cross‑platform).

## Build from source

Requirements: Node, Rust stable.

```bash
git clone https://github.com/sqdshguy/pasterust
cd pasterust
npm install
npm run tauri dev
```

Release build (much more optimized):

```bash
npm run tauri build
```

## Contributing

Pull requests are welcome. Include benchmarks when proposing performance changes so impact is measurable.

## License

MIT
