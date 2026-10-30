---
"@qino/cms": minor
---

Adds `getEntries` and `getAncestors` to trees. `getEntries` reads every entry in reading order with the selected view, for sitemaps, search indexes, and feeds. `getAncestors` returns the nodes above a slug, from the root down, for breadcrumbs:

```ts
const entries = await docsTree.getEntries();
const ancestors = await docsTree.getAncestors("guides/mutations/optimistic");
// TreeNodes for "guides" and "guides/mutations"
```
