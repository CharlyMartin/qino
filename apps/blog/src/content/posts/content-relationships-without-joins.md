---
title: "Content Relationships Without Joins"
created-on: "2025-09-05T09:30:00Z"
updated-on: "2025-09-10T13:00:00Z"
image: "https://picsum.photos/seed/content-relationships-without-joins/1200/630"
---

Without a database, "join" doesn't really apply. But content has relationships — posts have authors, posts have tags, tags have parent categories. You still need to model them.

The pattern that works: *slug references, resolved at build time*.

A post's frontmatter:

```yaml
title: "Hello, world"
author: jane
tags: [cms, markdown]
```

The build pipeline reads the post, looks up `authors/jane.md`, looks up `tags/cms.md` and `tags/markdown.md`, and inlines them into the final object.

The result, at runtime, is a fully-resolved post:

```ts
post.author.name;     // "Jane Doe"
post.tags[0].title;   // "CMS"
```

No joins, no N+1 queries — because the work happened once, at build time.
