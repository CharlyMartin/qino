---
title: "Frontmatter Validation with Zod"
created-on: "2026-02-19T10:30:00Z"
updated-on: "2026-02-25T15:00:00Z"
image: "https://picsum.photos/seed/frontmatter-validation-with-zod/1200/630"
author: "authors/lars-eriksson.json"
categories:
  - "categories/type-safety.json"
  - "categories/content-modeling.json"
  - "categories/tooling.json"
---

A schema is the bridge between "frontmatter is whatever YAML I happened to type" and "frontmatter is a typed contract". Zod is the easiest way to build that bridge.

A complete example:

```ts
import { z } from "zod";

const PostSchema = z.object({
  title: z.string().min(1).max(120),
  "created-on": z.string().datetime(),
  "updated-on": z.string().datetime(),
  image: z.union([z.string().url(), z.literal("")]),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

export type Post = z.infer<typeof PostSchema>;

export function parsePost(frontmatter: unknown): Post {
  return PostSchema.parse(frontmatter);
}
```

Two things to notice:

1. The same schema gives you runtime validation *and* a static type. No drift.
2. Defaults (`draft: false`) mean older files without the field still parse cleanly.

Run this at build time across the collection, and bad frontmatter fails fast — at the developer's desk, not in production.
