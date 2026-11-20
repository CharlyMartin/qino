---
"@qino/cms": minor
---

Adds agent Markdown to trees and items, as collections have it. A tree declares `pages` like a collection, and an item declares its one `page`:

```ts
const docs = qino.defineTree({ directory: "docs", titleField: "title", pages: { index: "/docs", entry: "/docs/{slug}" }, … });
const about = qino.defineItem({ file: "about.md", page: "/about", … });
```

`docs.getAgentMarkdown(slug)` titles the entry from the tree's `titleField`, keeps nested slugs such as `guide/cli`, and returns `null` for a slug the tree doesn't list. `about.getAgentMarkdown()` returns the item's agent Markdown. `docs.getMarkdownUrl(slug)` and `about.getMarkdownUrl()` return their Markdown URLs, and an item at `/` has the Markdown URL `/index.md`.
