---
"@qino/cms": minor
---

Adds `incrementalEntries` to `initQino`, for long-running dev servers. On a large collection, every `getEntries` call, and every `getPaginatedEntries` call on a view that filters or sorts, resolved each entry's images and relations again, which took seconds per page under `next dev`.

```ts
export default initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  incrementalEntries: process.env.NODE_ENV == "development",
});
```

- Each view keeps its entries, with every file they were built from: the entry's own file, its images, and the relation targets it resolved, with theirs.
- Each call checks those files with one sync stat each, and builds again only the entries whose files changed, so an edit shows up on the next call.
- `augment`, `filter`, and `sort` still run on every call. A sync `augment` no longer costs a promise per entry.
- With the option on, a reused entry skips its relation and media `parse` callbacks, a lazy relation target must always return the same collection, and entries that reference one target can hold different objects for it.

On 10,000 posts with a stand-in for `next dev`'s async tracking, a repeated call drops from about 3.6 s to about 50 ms, and editing an author of 879 posts costs about 0.4 s. The first call for each view still builds every entry.

Also changes which error a listing throws when several entries fail, with or without the option: the first in slug order, and a read or validation error before a relation or `augment` error, instead of whichever failed first.
