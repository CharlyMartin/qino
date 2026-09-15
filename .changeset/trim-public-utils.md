---
"qino": minor
---

Limit `qino/utils` to `markdown` and the `MarkdownStats` type. This is a breaking change: `assertDirectory`, `assertFile`, `isDirectory`, `isFile`, and `removeLeadingSlash` are no longer public exports. Replace any use of those internal helpers in consumer applications before upgrading.
