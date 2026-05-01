---
title: "Why Folder Structure Is API"
created-on: "2025-09-17T10:00:00Z"
updated-on: "2025-09-17T10:00:00Z"
image: "https://picsum.photos/seed/why-folder-structure-is-api/1200/630"
author: "authors/camille-laurent.json"
categories:
  - "categories/architecture.json"
  - "categories/content-modeling.json"
  - "categories/philosophy.json"
---

In a flat-file CMS, the folder structure *is* your data model. Renaming a folder is a breaking change.

That sounds dramatic until you realize it's also true of databases — `ALTER TABLE` is a breaking change, you've just been trained to be careful with it. Folders deserve the same care.

A few habits that help:

- Pick collection names you can live with. `posts` vs `articles` vs `blog` — choose once.
- Don't reorganize halfway through. The file paths leak into Git history, into URLs, into people's bookmarks.
- If you must rename, do it in a single commit and add a redirect map.

The plus side of folders-as-API: it's *visible*. Anyone reading the repo understands your data model in five seconds. No documentation needed.
