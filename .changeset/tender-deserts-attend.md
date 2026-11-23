---
"@qino/cms": minor
---

Adds page Markdown for index pages. Called without a slug, `getPageMarkdown()` on a collection or a tree returns one unpaginated listing that links every entry's Markdown URL, with its description, after a frontmatter block with the index page's title and URL:

```md
---
title: "Blog"
canonical: "https://example.com/blog"
---

# Blog

- [Hello](https://example.com/blog/hello.md): The first post.
- [World](https://example.com/blog/world.md)
```

A collection lists the entries its default view keeps, in its order. A tree gives each root node a `##` section that lists the node and then its descendants. The heading is `pages.title`, which `pages` requires. `getMarkdownUrl()` without a slug returns the index page's Markdown URL, such as `https://example.com/blog.md`.
