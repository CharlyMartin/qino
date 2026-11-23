---
"@qino/cms": minor
---

Removes the `raw` field from Markdown entries. For a page's Markdown to copy or serve, such as a "Copy page as Markdown" button, use `getPageMarkdown`, which needs `pages` and `initQino({ siteUrl })`. For the untouched source file, read it from `_meta.filePath`. This is a breaking change:

```diff
- const markdown = entry.raw;
+ const markdown = await posts.getPageMarkdown(entry._meta.slug);
+ // Or, for the source file, frontmatter included:
+ const source = await fs.readFile(entry._meta.filePath, "utf8");
```

`raw` is no longer reserved, so Markdown frontmatter and schemas can declare a `raw` field of their own.
