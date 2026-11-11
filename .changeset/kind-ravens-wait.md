---
"@qino/cms": minor
---

Rejects frontmatter written in a language other than YAML. A file starting with `---json` or `---js` now fails with `Frontmatter must be YAML: "---json" isn't supported.`; before, `---json` was parsed as JSON and `---js` was evaluated as JavaScript. This is a breaking change: rewrite such frontmatter as YAML.

```diff
- ---json
- { "title": "Hello" }
- ---
+ ---
+ title: Hello
+ ---
```

Also drops the `gray-matter` dependency: files are read with `parseFrontmatter` from `@qino/tooling`, the reader the Qino cloud UI uses.
