---
title: "Qino"
tagline: "A flat-file Markdown CMS that respects your editor."
"featured-posts":
  - "posts/the-smallest-useful-cms.md"
  - "posts/why-folder-structure-is-api.md"
  - "posts/content-modeling-without-an-orm.md"
---

Qino keeps your content in plain Markdown and JSON, validates it with your schemas, and gives you typed getters that resolve relations without a database in the loop.

## Why?

Most Markdown CMSes treat content files as opaque blobs. You get a string of Markdown and a loose bag of metadata, and it's up to you to parse, validate, and stitch it together into something usable. This is a leaky abstraction that leads to a lot of boilerplate and runtime errors.

Qino's goal is to make content relationships first-class citizens, and to provide a type-safe API for working with them. By declaring relations in your collection schemas, you get:

- **Compile-time guarantees** that your content files are well-formed and that your relations point to valid targets.
- **Ergonomic getters** that resolve relations for you, so you can work with fully
  typed data objects instead of raw Markdown and metadata.
