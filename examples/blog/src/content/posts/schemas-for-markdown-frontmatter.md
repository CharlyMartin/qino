---
title: "Schemas for Markdown Frontmatter"
created-on: "2025-03-29T10:00:00Z"
updated-on: "2025-03-29T10:00:00Z"
image: "https://picsum.photos/seed/schemas-for-markdown-frontmatter/1200/630"
author: "authors/lars-eriksson.json"
categories:
  - "categories/type-safety.json"
  - "categories/content-modeling.json"
  - "categories/tooling.json"
---

Frontmatter without a schema is a JSON blob. Frontmatter *with* a schema is a typed contract — and that's what makes a flat-file CMS feel like a CMS, not a folder.

A minimal Zod schema for a blog post:

```ts
import { z } from "zod";

export const PostSchema = z.object({
  title: z.string().min(1),
  "created-on": z.string().datetime(),
  "updated-on": z.string().datetime(),
  image: z.string().url().or(z.literal("")),
  draft: z.boolean().default(false),
});
```

Run that at build time across every file in the collection and you get two things for free:

- **Validation.** Bad frontmatter fails the build, not production.
- **Types.** `z.infer<typeof PostSchema>` is your `Post` type, generated from the same source of truth.

The second one is the real prize. No more drift between docs and code.
