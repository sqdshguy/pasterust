# ⚡️🦀 PasteRust – Warp-Speed Context for Your LLM

An app to copy files (and your prompt of choice) into the clipboard for instant LLM context.

**Engineers 🚀** – ship code faster with a tool that treats *time* as a first-class constraint.

> “Re-indexed (cold startup) the entire TensorFlow monorepo (≈3 GB, 11 k files) in **6.7 seconds** on a humble i3‑10105F.
> No coffee breaks required.” — *PasteRust benchmark log*

---

## Why PasteRust Exists

I used [**kleneway/pastemax**](https://github.com/kleneway/pastemax) for months, but eventually got tired of Electron's sluggishness and waiting two minutes for the codebase to load. So I rebuilt the core in Rust + Tauri, cut out the bloat, and achieved native-level speed.

---

## 🔥 Headline Features

| 🚀 What you get                                                 | 💎 Why it matters                                   |
| --------------------------------------------------------------- | --------------------------------------------------- |
| **Blazing Startup** – single‑digit seconds, even for mega‑repos | Less waiting, more doing                            |
| **Folder‑First Workflow** – point to any directory              | Zero ceremony onboarding                            |
| **Smart File Detection**                                        | Auto‑filters *all* common code & config formats     |
| **Checkbox Precision**                                          | Include whole trees or single needles               |
| **Custom Prompts**                                              | Jam context instructions straight into the payload  |
| **Pristine XML Output**                                         | Drop‑in ready for RAG, embeddings, agents           |
| **Dark‑mode Native UI**                                         | Built with React/Tauri – 30 MB on disk, <150 MB RAM |

---

## 📦 Supported File Types (abridged)

* **Languages**: Rust, Python, JS/TS, C/C++, C#, Java, Go, Swift, Kotlin, …
* **Web**: HTML, CSS, SCSS, Vue, Svelte, JSX/TSX
* **Config & Docs**: JSON, YAML, TOML, Dockerfile, Makefile, Markdown, LaTeX

*(If your linter understands it, PasteRust probably does too.)*

---

## 🛠️ From Click to Clipboard

1. **Select Folder** →
2. **Glance at Detected Files** →
3. **Tick the ones you need** →
4. *(Optional)* **Add an LLM prompt** →
5. **Copy XML** – you’re done.

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

## ✨ Tech Stack Faithful to Performance

| Layer           | Choice                    | Rationale                                 |
| --------------- | ------------------------- | ----------------------------------------- |
| **Frontend**    | React + TypeScript + Vite | Hot‑reload that actually feels hot        |
| **Runtime**     | **Rust**                  | Safety at the speed of C                  |
| **Host**        | **Tauri**                 | Native WebView, 10× lighter than Electron |
| **FS Crawling** | `walkdir` crate           | Thread‑pooled I/O traversal               |
| **Clipboard**   | Tauri plugin              | Cross‑platform sanity                     |

---

## Quickstart

```bash
# Prerequisites: Node 16+, Rust stable, Tauri CLI
git clone https://github.com/sqdshguy/pasterust
cd pasterust
npm install          # 🍿 grab deps
npm run tauri dev    # ⚡ start hacking
```

### Production Build

```bash
npm run tauri build  # creates native installers for your OS
```

---

## 🪪 License

[MIT](LICENSE) – because good tools should travel far.

## 🤝 Contributing

Pull requests are welcome! If you have ideas for features that would help software engineers, I'd love to hear them and see them added. For any proposed optimizations, please include benchmarks to demonstrate their impact.


*PasteRust: less bloat, more velocity.*
