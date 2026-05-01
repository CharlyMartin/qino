---
title: "The Quiet Power of Flat Files"
created-on: "2024-11-05T09:23:00Z"
updated-on: "2024-11-12T14:10:00Z"
image: "https://picsum.photos/seed/the-quiet-power-of-flat-files/1200/630"
author: "authors/diego-moreno.json"
---

Flat files have a way of outlasting the tools that produced them. A `.md` file written today will still open in any editor in twenty years, while the SaaS platform you wrote it in may have shut down by then.

## Why it matters

- **Portability** — move them anywhere, no export step.
- **Longevity** — plain text is the most durable format we have.
- **Ownership** — your content lives in your repo, not someone else's database.

> "The best format is the one you can still open in ten years."

A small example of how this plays out in code:

```ts
const post = await getOnePost({ slug: "hello" });
console.log(post.title);
```

That's it. No client SDK, no API key, no rate limits.
