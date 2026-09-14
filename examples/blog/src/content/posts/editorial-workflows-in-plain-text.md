---
title: "Editorial Workflows in Plain Text"
created-on: "2025-02-04T08:00:00Z"
updated-on: "2025-02-19T15:45:00Z"
image: "https://picsum.photos/seed/editorial-workflows-in-plain-text/1200/630"
author: "authors/mei-tanaka.json"
categories:
  - "categories/editorial.json"
  - "categories/tooling.json"
---

Editorial workflow — drafts, review, scheduling, approval — is usually the first thing a flat-file CMS gets accused of lacking. It's also the easiest to add, once you stop trying to mimic database-backed CMSes.

A `draft: true` field, a branch per piece, and a PR template covers 80% of what most teams need. The remaining 20% is mostly *interface* — a friendlier UI on top of Git.

Things that fall out for free once content is in Git:

- **Review** — pull request with line-level comments.
- **Approval** — branch protection rules.
- **Scheduling** — a cron that merges branches whose `publish-on` has passed.
- **Audit** — `git log`.

You don't need a workflow engine. You need a workflow.
