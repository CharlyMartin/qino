---
title: "Why Build Steps Matter"
created-on: "2025-06-12T08:30:00Z"
updated-on: "2025-06-15T14:00:00Z"
image: "https://picsum.photos/seed/why-build-steps-matter/1200/630"
author: "authors/jane-doe.json"
---

A flat-file CMS without a build step is just a folder. The build step is where it earns the *CMS* part of the name.

What a good build step does:

- Validates frontmatter against the schema.
- Resolves relationships (slugs to author objects, tags to tag pages).
- Generates a manifest of slugs and metadata for fast lookups.
- Emits TypeScript types so the editor knows what `post.title` is.

Skip the build step and you push all of that work to runtime. Runtime is where users wait.

```bash
qino build
# ✓ validated 50 posts
# ✓ resolved 12 author refs
# ✓ wrote qino-lock.json
# ✓ wrote qino.d.ts
```

Twenty seconds at build time saves you twenty milliseconds × thousands of requests. The math is on your side.
