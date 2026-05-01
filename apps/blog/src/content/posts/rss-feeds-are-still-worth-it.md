---
title: "RSS Feeds Are Still Worth It"
created-on: "2025-11-19T10:00:00Z"
updated-on: "2025-11-19T10:00:00Z"
image: "https://picsum.photos/seed/rss-feeds-are-still-worth-it/1200/630"
---

RSS isn't dead. It's just stopped being talked about.

The audience that uses RSS is small but loyal — and importantly, they're the readers who actually *follow* publications instead of waiting for an algorithm to surface them. For a niche blog, that's exactly the audience you want.

Generating an RSS feed from a flat-file CMS is twenty lines:

```ts
const items = posts
  .sort(byDateDesc)
  .slice(0, 20)
  .map(toRssItem);

const xml = renderRss({
  title: "My Blog",
  link: "https://example.com",
  items,
});

await writeFile("public/feed.xml", xml);
```

Wire that into your build, link it from your `<head>`, and you're done. It costs nothing to maintain and occasionally surprises you with a new reader.
