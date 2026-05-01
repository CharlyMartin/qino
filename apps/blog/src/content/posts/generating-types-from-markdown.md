---
title: "Generating Types from Markdown"
created-on: "2025-09-26T09:00:00Z"
updated-on: "2025-10-02T11:30:00Z"
image: "https://picsum.photos/seed/generating-types-from-markdown/1200/630"
---

The endgame for a flat-file CMS is *the editor knowing what your content looks like* — not at runtime, but as you type.

The pieces:

1. A schema (Zod, Valibot, your taste).
2. A build step that reads every file in a collection and validates it.
3. A code-gen step that emits a `.d.ts` with literal slug unions and resolved types.

The output is unglamorous and incredibly useful:

```ts
export type BlogSlug =
  | "the-quiet-power-of-flat-files"
  | "why-markdown-outlives-frameworks"
  | "from-wysiwyg-to-plain-text";

export type Post = {
  title: string;
  "created-on": string;
  "updated-on": string;
  image: string;
};
```

Now `getOnePost("typo")` is a compile error. That's the whole pitch.
