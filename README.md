# ⚡️🦀 PasteRust – Fast Context for Your LLM

PasteRust is a small desktop app that copies files (and an optional prompt) into your clipboard so you can drop them straight into an LLM.

> Benchmarked: re‑indexed the entire TensorFlow monorepo (\~1.6 GB) in **6.7 seconds** on an entry‑level i3‑10105F.

---

## Why I built this

I used [**kleneway/pastemax**](https://github.com/kleneway/pastemax) for months, but Electron felt too heavy. It took two minutes just to load a codebase. So I rewrote it in Rust + Tauri. The result: a fraction of the size, native speed, and no waiting around.

---

## 🔥 Features

| What you get                            | Why it matters                                 |
| --------------------------------------- | ---------------------------------------------- |
| **Fast startup** – seconds, not minutes | Spend time coding, not waiting                 |
| **Folder-first workflow**               | Point it at a repo, and it just works          |
| **Smart file detection**                | Picks up code, configs, and docs automatically |
| **Checkbox selection**                  | Include everything or just the files you need  |
| **Custom prompts**                      | Add context instructions directly              |
| **Clean XML output**                    | Ready to feed into RAG, embeddings, or agents  |
| **Native dark UI**                      | Built with Tauri/React – ~30 MB install size  |

---

## 📦 Supported File Types

* **Languages**: Rust, Python, JS/TS, C/C++, C#, Java, Go, Swift, Kotlin, ...
* **Web**: HTML, CSS, SCSS, Vue, Svelte, JSX/TSX
* **Config & Docs**: JSON, YAML, TOML, Dockerfile, Makefile, Markdown, LaTeX

*(If your editor supports it, chances are PasteRust does too.)*

---

## 🛠️ Workflow

1. Select a folder
2. Review the detected files
3. Check the ones you want
4. (Optional) Add a custom prompt
5. Copy XML — done

```xml
<source_code_context>
  <user_prompt>Refactor for async/await best practices.</user_prompt>
  <files>
    <file path="src/lib.rs" name="lib.rs">
      // snip
    </file>
  </files>
</source_code_context>
```

---

## ✨ Tech Stack

| Layer         | Choice                    | Why                                       |
| ------------- | ------------------------- | ----------------------------------------- |
| **Frontend**  | React + TypeScript + Vite | Fast dev cycle, hot reload                |
| **Runtime**   | Rust                      | Memory safety + C‑like speed              |
| **Host**      | Tauri                     | Native WebView, way lighter than Electron |
| **FS crawl**  | `walkdir` crate           | Efficient, parallel file traversal        |
| **Clipboard** | Tauri plugin              | Works across platforms                    |

---

## Quickstart

```bash
# Requirements: Node 16+, Rust stable, Tauri CLI
git clone https://github.com/sqdshguy/pasterust
cd pasterust
npm install
npm run tauri dev
```

### Production Build

```bash
npm run tauri build  # Creates native installers for your OS
```

---

## 🤝 Contributing

Pull requests welcome. If you’re adding optimizations, please include benchmarks so the impact is clear. Feature ideas that make life easier for engineers are especially encouraged.

## 📄 License

MIT License

---

*PasteRust: less bloat, more speed.*
