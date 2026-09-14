---
title: "Preview Modes Without Servers"
created-on: "2026-03-23T10:00:00Z"
updated-on: "2026-03-28T15:00:00Z"
image: "https://picsum.photos/seed/preview-modes-without-servers/1200/630"
author: "authors/mei-tanaka.json"
categories:
  - "categories/tooling.json"
  - "categories/editorial.json"
---

"Preview before publish" is one of the features people miss most when moving to a static site. The good news: you can have it, without giving up static.

The pattern is *branch deploys*. Most modern hosts (Vercel, Netlify, Cloudflare Pages) build a preview URL for every branch and pull request automatically.

The flow:

1. Author edits content on a branch.
2. Pushes the branch.
3. Host builds it and posts a preview URL on the PR.
4. Reviewers click the link and see *exactly* what production will look like.
5. Merge → deploy.

No preview mode flag, no draft state to manage in code. The branch is the preview.

The trade-off is that builds take time. If you're previewing twenty edits a day, your build needs to be fast or the loop is painful. Which loops back to "build performance is editorial UX".
