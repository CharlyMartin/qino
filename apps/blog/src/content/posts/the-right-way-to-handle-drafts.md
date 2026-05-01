---
title: "The Right Way to Handle Drafts"
created-on: "2025-08-26T11:00:00Z"
updated-on: "2025-09-01T15:00:00Z"
image: "https://picsum.photos/seed/the-right-way-to-handle-drafts/1200/630"
---

Drafts are deceptively simple. There are at least four reasonable ways to handle them and each has a hidden cost.

## Approach 1: `draft: true` in frontmatter

Easy. Build excludes drafts from production. Downside: drafts are in the same branch as published posts, so a partial deploy can leak them.

## Approach 2: separate `drafts/` folder

Clean separation. Downside: moving a file when it goes live changes its history.

## Approach 3: separate branch per draft

Maximum isolation. Downside: a lot of branch management for a small team.

## Approach 4: a `publish-on` date in the future

The post is "live" the moment its date passes. Downside: you need a scheduled job to trigger the rebuild.

For most teams, Approach 1 is enough. Reach for the others when you have a specific reason — usually a leak you actually had.
