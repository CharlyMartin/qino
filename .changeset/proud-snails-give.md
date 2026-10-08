---
"@qino/cms": minor
---

Replaces `mediaFolder` with a `media` option on `initQino` and adds an opt-in media check to `qino check` and `qino build`. This is a breaking change:

```diff
  initQino({
    contentFolder: "content",
-   mediaFolder: "public",
+   media: { folder: "public" },
  });
```

Set `media.extensions` to verify that every root-relative URL with one of those extensions exists in `media.folder`. The check scans Markdown images and links, `src`/`poster` attributes, and frontmatter or JSON values. Missing files are listed with their `file:line`. Skip generated or proxied paths with `media.ignore` globs:

```ts
media: {
  folder: "public",
  extensions: ["png", "webp", "mp4"],
  ignore: ["/api/**"],
},
```
