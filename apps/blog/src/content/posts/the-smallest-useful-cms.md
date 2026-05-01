---
title: "The Smallest Useful CMS"
created-on: "2026-01-08T10:00:00Z"
updated-on: "2026-01-12T14:00:00Z"
image: "https://picsum.photos/seed/the-smallest-useful-cms/1200/630"
---

What's the *least* a CMS can do and still be a CMS?

I'd argue it's three things:

1. **Read content from somewhere.**
2. **Validate it against a schema.**
3. **Hand it back as typed objects.**

Everything else — admin UIs, publishing workflows, image pipelines — is layered on top. A CMS that does only those three things is small enough to fit in a single TypeScript file, and *useful* enough to power a real blog.

The smaller the core, the more replaceable each layer becomes. That's the design ethos behind tools like Astro Content Collections, Contentlayer, and the Qino we're building here. Strip it down. Add features when you actually need them.
