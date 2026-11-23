---
"@qino/cms": minor
---

Removes the `raw` field from Markdown entries. For a page's Markdown to copy or serve, such as a "Copy page as Markdown" button, use `getPageMarkdown`, which needs `pages` (or `page` on an item) and `initQino({ siteUrl })`. For the untouched source file, read it from `_meta.filePath`. This is a breaking change:

```diff
- const markdown = post.raw;
+ // The page's Markdown, or null for a slug with no entry:
+ const markdown = await posts.getPageMarkdown(post._meta.slug);
+ // Items take no slug:
+ const aboutMarkdown = await about.getPageMarkdown();
+ // The source file, frontmatter included:
+ const source = await fs.readFile(post._meta.filePath, "utf8");
```

`raw` is no longer reserved, so Markdown frontmatter, schemas and `augment` can add a `raw` field of their own.
