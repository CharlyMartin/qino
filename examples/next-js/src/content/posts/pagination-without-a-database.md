---
title: "Pagination Without a Database"
created-on: "2025-10-17T10:00:00Z"
updated-on: "2025-10-22T13:00:00Z"
image: "https://picsum.photos/seed/pagination-without-a-database/1200/630"
author: "authors/yuki-sato.json"
categories:
  - "categories/architecture.json"
  - "categories/performance.json"
---

Pagination on a static site sounds like a contradiction — there's nothing to query — but it's actually one of the easiest things to get right.

The pattern: at build time, sort all posts, slice into pages, and emit a route per page.

```ts
const PER_PAGE = 10;
const sorted = posts.sort(byDateDesc);
const pages = chunk(sorted, PER_PAGE);

for (const [i, page] of pages.entries()) {
  emitRoute(`/blog/page/${i + 1}`, { posts: page });
}
```

That's it. Each page is a fully static HTML file, served instantly.

The trick is the sort key. Once you commit to a sort, changing it shifts every page. Posts that used to be on page 3 are now on page 5. Bookmarks break. Be deliberate about ordering.
