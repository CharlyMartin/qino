---
"@qino/cms": minor
"@qino/tooling": minor
---

Adds a `media` option to `defineCollection`, `defineTree`, and `defineItem`. It declares media fields by path, each with one accepted MIME type and a `maxSize`. Image fields are now read as a `QinoImage`, with `width`, `height`, and a blur placeholder, ready for `next/image`:

```ts
qino.defineCollection({
  directory: "posts",
  extension: ".md",
  schema,
  media: {
    cover: { accepted: "image/webp", maxSize: "5MB" },
    markdown: [
      { accepted: "image/webp", maxSize: "1MB" },
      { accepted: "image/png", maxSize: "1MB" },
    ],
  },
});

const post = await posts.getEntry("hello");
<Image src={post.cover} alt="" placeholder="blur" />;
```

`markdown` lists the rules body images must match, one type per rule. `qino check` verifies every media field and body image: a file in `mediaFolder`, of the accepted type, under its `maxSize`. Images are read with sharp, loaded only when an entry has an image field.

This is a breaking change. Media config moves out of `cloud`:

- `initQino`'s `cloud.media` is removed.
- A primitive's `cloud.media.fields` and `cloud.media.accepted` are replaced by the top-level `media`.
- `cloud.media.saveAs` is renamed `cloud.media.saveFileAs`, and takes a new `{field}` token.

```diff
 initQino({
   contentFolder: "src/content",
   mediaFolder: "public",
   cloud: {
     publish: { mode: "open_pull_request", reviewBeforePublish: true },
-    media: { accepted: [{ type: "image/webp", maxSize: "5MB" }] },
   },
 });

 qino.defineCollection({
   directory: "posts",
   extension: ".md",
   schema,
+  media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
   cloud: {
-    media: { saveAs: "posts/{name}-{hash}", fields: ["cover"] },
+    media: { saveFileAs: "posts/{name}-{hash}" },
   },
 });
```

`cover` is now a `QinoImage`; read its URL from `cover.src`. In `config.json`, each primitive lists its `media` with sizes in bytes, and `cloud.media` holds only `saveFileAs`. The `@qino/tooling` schemas match.

Also fixes reading an entry whose relation array is `null`, such as `categories: null` with a `"categories[*]"` relation: it now stays `null` instead of throwing.
