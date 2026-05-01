---
title: "Open Graph for Static Blogs"
created-on: "2026-04-05T11:00:00Z"
updated-on: "2026-04-05T11:00:00Z"
image: "https://picsum.photos/seed/open-graph-for-static-blogs/1200/630"
author: "authors/raj-patel.json"
---

Open Graph metadata is the difference between a link that previews beautifully on social media and one that shows a default favicon and a truncated URL.

The minimum viable set:

```html
<meta property="og:title" content="Post title">
<meta property="og:description" content="One-sentence summary.">
<meta property="og:image" content="https://example.com/og/post-slug.png">
<meta property="og:type" content="article">
<meta property="og:url" content="https://example.com/blog/post-slug">
```

For a flat-file CMS, every one of these maps to frontmatter:

- `og:title` → `title`
- `og:description` → `summary` (auto-generated from the first paragraph if missing)
- `og:image` → `image` (or a default per-collection)
- `og:url` → derived from the slug

The image is the one most people get wrong. Default to a per-post image; fall back to a branded template with the title rendered in. Generate it at build time so it's cached forever.
