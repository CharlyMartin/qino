---
"@qino/cms": minor
---

Adds `markdownToc` to Markdown and MDX collections, trees, and items. It adds a `_toc` field to each entry: the body's headings in document order, as `{ heading, id, text }`. The ids match the ones `rehype-slug` gives the rendered headings. Set `true` to list every heading, or `{ upTo: "h3" }` to stop at a level:

```ts
const docs = qino.defineTree({
  directory: "docs",
  extension: ".mdx",
  schema: DocSchema,
  titleField: "title",
  markdownToc: { upTo: "h3" },
});

(await docs.getEntry("install"))._toc;
// [{ heading: 2, id: "requirements", text: "Requirements" }, …]
```

A heading ending in `{#id}` keeps that id, as with `remark-custom-heading-id`. For sites that make ids their own way, `slug` turns each heading's text into its id:

```ts
markdownToc: { upTo: "h4", slug: (text) => text.replace(/[^a-zA-Z0-9]/g, "") },
```

`text` leaves out MDX components, so `` ## `watch`: <TypeText>() => T</TypeText> `` reads `watch:`.

`_toc` is now reserved in Markdown schemas and frontmatter, like `_stats`. The `MarkdownToc` and `MarkdownTocHeading` types are exported.
