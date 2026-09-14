---
title: "Frontmatter Conventions That Scale"
created-on: "2025-01-03T09:00:00Z"
updated-on: "2025-01-08T11:45:00Z"
image: "https://picsum.photos/seed/frontmatter-conventions-that-scale/1200/630"
author: "authors/hanna-voss.json"
categories:
  - "categories/content-modeling.json"
  - "categories/type-safety.json"
---

Frontmatter is the load-bearing wall of a flat-file CMS. Get the conventions right early or pay for them every time you add a new field.

A few rules that have held up for me:

1. **Use kebab-case keys.** `created-on`, not `createdOn` or `created_on`. It survives YAML, JSON, and TOML cleanly.
2. **Always quote dates.** ISO-8601 strings, in UTC. Skip the timezone gymnastics.
3. **Validate at build time.** A schema check beats a runtime crash on a missing field.

Here's a typical shape:

```yaml
title: "Post title"
created-on: "2025-01-03T09:00:00Z"
updated-on: "2025-01-08T11:45:00Z"
tags: [cms, markdown]
draft: false
```

The schema for that frontmatter is the *real* contract between editors and developers. Treat it like an API.
