---
title: "The Lock File Pattern for Content"
created-on: "2025-02-14T12:00:00Z"
updated-on: "2025-02-14T12:00:00Z"
image: "https://picsum.photos/seed/the-lock-file-pattern-for-content/1200/630"
author: "authors/tomas-silva.json"
categories:
  - "categories/architecture.json"
  - "categories/type-safety.json"
  - "categories/tooling.json"
---

Package managers solved a hard problem: how do you describe the *exact* state of a dependency tree, in a file, in a way that's both human-readable and machine-stable? The answer is the lock file.

The same pattern translates beautifully to content. A `qino-lock.json` (or whatever you want to call it) captures the schema, the slugs, the relationships — everything a build needs to know about your collections, frozen at a point in time.

```json
{
  "version": 1,
  "collections": {
    "blog": {
      "schema": { "title": "string", "tags": "string[]" },
      "slugs": ["hello", "world"]
    }
  }
}
```

Check it in. Diff it on PRs. Use it to generate `.d.ts` types so your editors know what `post.title` is *before* you run the build.
