---
title: "Caching Strategies for Markdown"
created-on: "2025-07-04T12:00:00Z"
updated-on: "2025-07-04T12:00:00Z"
image: "https://picsum.photos/seed/caching-strategies-for-markdown/1200/630"
author: "authors/jane-doe.json"
categories:
  - "categories/performance.json"
  - "categories/architecture.json"
---

Markdown parsing isn't free. Run it on every request and you'll feel it; run it once and cache the result and you won't.

Three layers worth caching:

1. **Parsed AST.** Cache by file content hash. Cheap to compute, expensive to repeat.
2. **Rendered HTML.** Cache by `(ast, renderer-version)`. The renderer version matters — bump it and your cache is correctly invalidated.
3. **Page-level output.** Cache by the union of inputs. Hardest to get right, biggest payoff.

The hash is doing all the work. Hash inputs accurately and you can cache aggressively without staleness.

> Cache invalidation is hard, but only when your cache key is wrong.
