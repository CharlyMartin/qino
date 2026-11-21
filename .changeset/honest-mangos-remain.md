---
"@qino/cms": minor
---

Adds agent Markdown to collections: a standalone Markdown version of each entry page, to serve to AI agents. Set `siteUrl` in `initQino`, and declare where the collection's pages live with `pages`:

```ts
const qino = initQino({ contentFolder: "content", mediaFolder: "public", siteUrl: "https://example.com" });

const posts = qino.defineCollection({
  directory: "posts",
  extension: ".mdx",
  schema,
  pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
});
```

`posts.getAgentMarkdown(slug)` returns the entry's title as a heading, its description as a quote, then its body without frontmatter, with site-relative links made absolute. It takes any string, such as a route param, and returns `null` when the slug is unknown or the view excludes the entry, so it pairs with `negotiateMarkdown`:

```ts
return (await negotiateMarkdown(request, () => posts.getAgentMarkdown(slug))) ?? next();
```

`posts.getMarkdownUrl(slug)` returns the entry's Markdown URL, such as `https://example.com/blog/hello.md`, for `<link rel="alternate">` and `Link` headers.
