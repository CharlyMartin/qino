---
title: "Sitemaps for Content-Heavy Sites"
created-on: "2025-11-29T11:30:00Z"
updated-on: "2025-12-04T15:00:00Z"
image: "https://picsum.photos/seed/sitemaps-for-content-heavy-sites/1200/630"
author: "authors/raj-patel.json"
---

Sitemaps are unglamorous SEO plumbing. They're also one of the highest-leverage things you can ship for a content-heavy site.

A `sitemap.xml` tells search engines:

- What pages exist.
- When they last changed (`lastmod` — your `updated-on` frontmatter, conveniently).
- How often they change (`changefreq`).
- How important they are relative to the rest (`priority`).

Most generators get the first two right and skip the others, which is fine. The big win is making sure *all* your pages are discoverable, not just the ones the crawler happens to find through links.

Generate it at build time, write it to `public/sitemap.xml`, and reference it from `robots.txt`. Three steps, indexed forever.
