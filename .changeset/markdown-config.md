---
"@qino/cms": minor
---

Groups the Markdown body options under `markdown`, the name of the field that holds the body. `media` now only holds frontmatter fields. This is a breaking change: `markdownStats`, `markdownToc`, and `media.markdown` are gone.

```ts
// Before
qino.defineCollection({
  directory: "posts",
  extension: ".md",
  schema: PostSchema,
  markdownStats: true,
  markdownToc: { upTo: "h3" },
  media: {
    cover: { accepted: "image/webp", maxSize: "5MB" },
    markdown: [{ accepted: "image/webp", maxSize: "1MB" }],
  },
});

// After
qino.defineCollection({
  directory: "posts",
  extension: ".md",
  schema: PostSchema,
  media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
  markdown: {
    stats: true,
    toc: { upTo: "h3" },
    media: [{ accepted: "image/webp", maxSize: "1MB" }],
  },
});
```

`markdown.media` takes one rule or a list. Each body rule can now have a `parse`, like a media field: `qino check` reads each image with every rule's own `parse`, and the image passes when one rule matches. The body itself is still read as written.

Any `markdown` on a JSON primitive is a type error, and throws at definition. `media.markdown` throws with a pointer to `markdown.media`. `config.json` is unchanged: body rules are still listed under `media.markdown`.

The `MediaRule`, `MediaSize`, and `MarkdownConfig` types are exported.
