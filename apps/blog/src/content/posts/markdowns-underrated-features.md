---
title: "Markdown's Underrated Features"
created-on: "2025-01-26T10:00:00Z"
updated-on: "2025-01-26T10:00:00Z"
image: "https://picsum.photos/seed/markdowns-underrated-features/1200/630"
---

Most people learn Markdown's headings and lists, then stop. The format has more to offer.

### Reference-style links

Instead of inlining URLs, you can define them at the bottom of the file:

```md
See [the spec][cm] for details.

[cm]: https://commonmark.org
```

Useful when the same link appears five times in an article.

### Footnotes

```md
This is a claim.[^1]

[^1]: With a citation.
```

### Definition lists

```md
Term
:   The thing being defined.
```

Not every parser supports the last two, but the ones that do (CommonMark + GFM extensions) cover most of the modern ecosystem. Worth knowing.
