---
"@qino/cms": minor
---

Adds `getPaginatedEntries` to collections, for listings too long to render at once. It returns one 1-indexed page of the selected view, with the totals to link the others:

```ts
const { entries, page, perPage, pageCount, total } =
  await postCollection.getPaginatedEntries(2, { view: "listing", perPage: 24 });
```

When the view has no `filter` and no `sort`, only that page's files are read. A page past `pageCount`, or a `page` or `perPage` that isn't a positive integer, throws.

#### Slug order

`getEntries` now returns entries in slug order when the view has no `sort`, instead of the order the file system lists them in, and `sort` ties keep that order. Pages stay the same on every call, and every machine returns the same order. Add a `sort` to a view to choose another order.

#### Parsed files are cached

Collections now keep each file's parsed, validated entry between calls, and re-read a file only once it changes. Repeated `getEntries` and `getPaginatedEntries` calls, such as one per static page, no longer parse and validate every file again. Images, relations, and views still run on every call.

- A file counts as changed when its size, modification time, or inode changes. For 2 seconds after an edit, its content is compared too.
- Entries can now share nested objects between calls, so treat them as read-only.
- A schema transform that reads data outside its own file, such as another file, runs again only when that file changes. Move that work to a view's `augment`, which runs on every call.
