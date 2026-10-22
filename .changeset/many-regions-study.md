---
"@qino/cms": minor
---

Adds a `markdownStats` option to `defineCollection`, `defineTree`, and `defineItem`. On Markdown and MDX primitives, `markdownStats: true` adds a typed `_stats` field (`wordCount`, `proseCharacterCount`, `sourceCharacterCount`) to every entry, related entries included. The Markdown parsers only load when it's on. `MarkdownStats` is now exported from `@qino/cms`.

Removes `@qino/cms/utils` and `getMarkdownStats`. `_stats` is now reserved in Markdown frontmatter and schemas. This is a breaking change:

```diff
- import { getMarkdownStats } from "@qino/cms/utils";
-
  export const postCollection = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: PostSchema,
+   markdownStats: true,
    views: (view) => ({
      default: view({
-       augment: (post) => {
-         const stats = getMarkdownStats(post.markdown);
-         return { readingMinutes: Math.ceil(stats.wordCount / 220) };
-       },
+       augment: (post) => ({
+         readingMinutes: Math.ceil(post._stats.wordCount / 220),
+       }),
      }),
    }),
  });
```
