---
title: "The Author Object Pattern"
created-on: "2026-03-12T09:30:00Z"
updated-on: "2026-03-19T14:00:00Z"
image: "https://picsum.photos/seed/the-author-object-pattern/1200/630"
author: "authors/hanna-voss.json"
---

Most blogs start with `author: "Jane Doe"` in their frontmatter. Six months later, "Jane Doe" needs a bio, an avatar, and a Twitter link — in five hundred posts. That's when the author object pattern earns its keep.

The shape:

```
content/
  authors/
    jane.md
    raj.md
  blog/
    hello.md  -> frontmatter has `author: jane`
```

Each author file:

```yaml
---
name: "Jane Doe"
bio: "Writes about flat-file CMSes and other quiet ideas."
avatar: "/images/authors/jane.jpg"
links:
  twitter: "https://twitter.com/janedoe"
  website: "https://janedoe.com"
---
```

The build resolves `author: jane` to the full object. Adding a new field to authors is a one-file change instead of a five-hundred-file find-and-replace.

This pattern generalizes — categories, tags, series — anywhere a string in frontmatter wants to grow up into an object.
