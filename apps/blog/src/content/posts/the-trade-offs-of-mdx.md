---
title: "The Trade-offs of MDX"
created-on: "2025-07-14T09:00:00Z"
updated-on: "2025-07-22T13:30:00Z"
image: "https://picsum.photos/seed/the-trade-offs-of-mdx/1200/630"
author: "authors/felix-berger.json"
---

MDX lets you embed React components in Markdown. That's powerful, and it's also where Markdown stops being portable.

A `.md` file is a document. An `.mdx` file is a *program* — and programs come with all the baggage that documents don't:

- A specific runtime (React, in this case).
- A specific bundler.
- A specific component library.

Move your `.mdx` file to a different stack and you're rewriting components, not just changing renderers.

The right rule: use `.md` for *content*, and `.mdx` only when you genuinely need interactivity in-line with prose. A "buy now" widget on a marketing page? MDX. A blog post about caching? Plain Markdown.

This isn't an anti-MDX take. It's a "use the right one" take.
