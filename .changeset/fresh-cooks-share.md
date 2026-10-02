---
"@qino/cms": minor
---

Changes `markdown` and `raw` on Markdown entries to be added after validation, like `_meta`. Schemas now validate frontmatter only, so they no longer need to declare either field, and strict objects work as-is. A file without frontmatter can use `z.object({})`. Both fields are still there in getters, views, and resolved relations.

This is a breaking change. In `.md`, `.mdx`, and `.markdown` entries, `markdown` and `raw` are now reserved schema keys. Declaring them is a type error, and an old schema that still requires them fails validation with a hint naming them. Remove them from Markdown schemas, and move any schema transform of `markdown` into a view `augment`:

```diff
  qino.defineCollection({
    directory: "/posts",
    extension: ".md",
    schema: z.object({
      title: z.string(),
-     markdown: z.string(),
-     raw: z.string(),
    }),
  });
```

JSON entries are unchanged: there, `markdown` and `raw` are still ordinary fields.
