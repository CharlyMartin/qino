---
title: "Search in a Static Site"
created-on: "2025-10-28T11:00:00Z"
updated-on: "2025-11-04T15:30:00Z"
image: "https://picsum.photos/seed/search-in-a-static-site/1200/630"
author: "authors/raj-patel.json"
---

"How do you do search without a server?" comes up every time someone considers a static site for a content-heavy project. The answer in 2026 is: easier than you think.

You have three reasonable options:

1. **Client-side index.** Build a search index at compile time, ship it as a JSON blob, run lookups in the browser with something like FlexSearch or MiniSearch. Works up to ~1,000 documents.
2. **Edge function + index.** Same index, but loaded into a Cloudflare Worker or similar. Scales further, still sub-millisecond.
3. **External search service.** Algolia, Pagefind, Typesense. Worth it past ~10,000 documents or when you want typo tolerance and ranking.

> The dirty secret: most blogs don't need search at all. Categorization and good navigation cover 90% of the use cases.

If you do need it, start with option 1. You can swap the implementation without changing the UI.
