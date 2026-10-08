---
"@qino/cms": minor
---

Replaces `mediaFolder` with a `media` option on `initQino` and adds a media check to `qino check` and `qino build`. This is a breaking change:

```diff
  initQino({
    contentFolder: "content",
-   mediaFolder: "public",
+   media: { folder: "public" },
  });
```

Every root-relative URL with a file extension in content must now exist in `media.folder`. The check scans Markdown images and links, `src`/`poster` attributes, and frontmatter or JSON values. Missing files are listed with their `file:line`. Exclude files served by routes, or turn the check off:

```ts
media: {
  folder: "public",
  checkReferences: { exclude: ["/og/**", "/feed.xml"] }, // or `false`
},
```
