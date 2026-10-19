---
"@qino/cms": minor
"@qino/tooling": minor
---

Adds two optional `cloud` options for naming things in the cloud UI, both written to `config.json`:

- `displayAs` names the primitive itself, such as `"Blog posts"`. It's a plain string and defaults to the id. An item is a single entry, so this also names its entry.
- `displayEntryAs` labels each entry of a collection or tree from its fields, using the same `{field}` tokens as `saveAs`. Unset, collections show the slug and trees fall back to `titleField`.

```ts
qino.defineCollection({
  directory: "authors",
  schema,
  extension: ".json",
  cloud: {
    displayAs: "Authors",
    displayEntryAs: "{firstName} {lastName}",
  },
});
```
