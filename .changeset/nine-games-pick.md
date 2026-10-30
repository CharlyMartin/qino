---
"@qino/cms": minor
---

Adds `getEntries` and `getAncestorNodes` to trees. `getEntries` reads every entry in reading order with the selected view, for sitemaps, search indexes, and feeds. `getAncestorNodes` returns the nodes above a slug, from the root down, for breadcrumbs:

```ts
const entries = await docsTree.getEntries();
const ancestors = await docsTree.getAncestorNodes(
  "guides/mutations/optimistic",
);
// TreeNodes for "guides" and "guides/mutations"
```
