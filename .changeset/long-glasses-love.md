---
"@qino/cms": minor
---

Adds a `cloud` option to `initQino`, `defineCollection`, `defineTree`, and `defineItem` to configure the Qino cloud UI: publish mode, review, accepted uploads, searchable and sortable fields, and where media lands. Values are written, resolved, into `qino/_generated/config.json`.

```ts
initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cloud: {
    publish: { mode: "open_pull_request", reviewBeforePublish: true },
    media: { accepted: [{ type: "image/*", maxSize: "5MB" }] },
  },
});

qino.defineCollection({
  // ...
  cloud: {
    searchableBy: ["title"],
    sortableBy: ["title"],
    media: { saveAs: "posts/{name}-{hash}.{ext}" },
  },
});
```

Removes `buildConfigFile`: setting `cloud` now writes `config.json`. This is a breaking change:

```diff
 initQino({
   contentFolder: "content",
   mediaFolder: "public",
-  buildConfigFile: true,
+  cloud: {
+    publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
+  },
 });
```
