---
title: "Tags, Categories, and Taxonomies"
created-on: "2025-11-08T09:00:00Z"
updated-on: "2025-11-12T14:00:00Z"
image: "https://picsum.photos/seed/tags-categories-and-taxonomies/1200/630"
author: "authors/hanna-voss.json"
categories:
  - "categories/content-modeling.json"
  - "categories/editorial.json"
---

Tags, categories, taxonomies — three words for "how do we group content" that mostly mean the same thing in practice but feel different to editors.

A workable distinction:

- **Categories** — a small, controlled list. Each post has *one*. Used in URLs.
- **Tags** — a larger, looser set. Each post has *several*. Used for filtering and discovery.
- **Taxonomies** — the schema for both, defined once.

The mistake most teams make is letting tags grow unbounded. Six months in, you have `markdown`, `Markdown`, `markdown-cms`, `markdown_cms`, and `md` — all referring to the same thing.

The fix is small but unsexy: validate tags against a known list at build time. Adding a new tag becomes an explicit step (a new file in `tags/`), not a typo.
