---
title: "Content Modeling Without an ORM"
created-on: "2025-02-25T10:30:00Z"
updated-on: "2025-03-01T14:00:00Z"
image: "https://picsum.photos/seed/content-modeling-without-an-orm/1200/630"
author: "authors/tomas-silva.json"
categories:
  - "categories/content-modeling.json"
  - "categories/architecture.json"
---

When your storage layer is a folder, your data model is the folder structure. That sounds reductive but it's actually the point.

A typical setup:

```
content/
  blog/        -> a collection
  authors/     -> another collection, referenced by blog posts
  pages/       -> singletons
```

Relationships are slugs. A post says `author: jane` in its frontmatter, and the loader resolves that against `authors/jane.md` at build time.

## Why this works

- The schema is *visible*. You can see your data model with `tree`.
- Relationships are explicit, not magic.
- There's no migration step when a field is added — only old files without it.

You lose some power: no joins, no transactions. For content, you don't need them.
