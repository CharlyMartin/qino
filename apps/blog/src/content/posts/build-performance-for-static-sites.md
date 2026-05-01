---
title: "Build Performance for Static Sites"
created-on: "2026-01-19T11:00:00Z"
updated-on: "2026-01-26T15:30:00Z"
image: "https://picsum.photos/seed/build-performance-for-static-sites/1200/630"
---

A static site's superpower is that builds happen *before* requests. The corollary: a slow build is the one performance problem your users don't see — but you do, every time you deploy.

Where the time usually goes:

| Stage              | Typical share | Easy win?                                |
|--------------------|---------------|------------------------------------------|
| Markdown parsing   | 5–15%         | Cache by content hash                    |
| Image processing   | 30–60%        | Skip unchanged inputs (also content hash) |
| Bundling           | 20–40%        | Persistent cache across builds            |
| Type-checking      | 5–20%         | Project references, incremental TSC      |

The biggest leverage is almost always images. A naive pipeline re-encodes everything on every CI run. A correct pipeline re-encodes only what changed.

> A 10-minute build deploys five times a day. A 1-minute build deploys whenever you want.
