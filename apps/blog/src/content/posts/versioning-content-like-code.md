---
title: "Versioning Content Like Code"
created-on: "2025-04-30T12:00:00Z"
updated-on: "2025-04-30T12:00:00Z"
image: "https://picsum.photos/seed/versioning-content-like-code/1200/630"
author: "authors/yuki-sato.json"
---

`git log` is the most underrated CMS feature in the world.

It tells you who changed what, when, and why — for every word of every post you've ever published. No audit table, no soft-delete schema, no event sourcing setup. Just commits.

```bash
git log --follow -p content/blog/the-quiet-power-of-flat-files.md
```

That command alone replaces an entire feature in most CMS roadmaps.

The tradeoff is real: editors need to learn enough Git to commit cleanly, or you need a UI that hides Git from them. But the underlying *capability* — full, line-level, attributed history of every change to every piece of content — is something most CMSes either don't have or charge extra for.
