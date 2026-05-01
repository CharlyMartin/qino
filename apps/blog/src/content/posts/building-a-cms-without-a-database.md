---
title: "Building a CMS Without a Database"
created-on: "2024-12-10T13:15:00Z"
updated-on: "2024-12-15T10:00:00Z"
image: "https://picsum.photos/seed/building-a-cms-without-a-database/1200/630"
---

A database is a useful default, but for content it's often the wrong abstraction. Content is read-heavy, change-rarely, and benefits enormously from being diffable. Files do all of this for free.

## The minimal stack

| Concern        | Database CMS      | Flat-file CMS    |
|----------------|-------------------|------------------|
| Storage        | Postgres          | `.md` files      |
| Querying       | SQL               | Filesystem walk  |
| Versioning     | Audit table       | `git log`        |
| Backup         | `pg_dump`         | `git clone`      |

Everything you'd build *around* the database — versioning, audit trails, branching for staging — comes for free with files in Git.

The catch is read patterns. If your CMS needs to answer "find me all posts tagged X, written by Y, in the last 30 days" in 5ms, the filesystem will struggle. Build an index at compile time and the problem disappears.
