---
"@qino/tooling": minor
---

Adds `parseFrontmatter` at `@qino/tooling/frontmatter`. It splits a Markdown or MDX file into its YAML frontmatter (`data`) and its `body`, exactly as `qino build` reads it, so tools like the Qino cloud UI read content files the same way. It needs no zod and uses no Node APIs:

```ts
import { parseFrontmatter } from "@qino/tooling/frontmatter";

const { data, body } = parseFrontmatter("---\ntitle: Hello\n---\n# Hello");
// data: { title: "Hello" }, body: "# Hello"
```
