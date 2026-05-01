---
title: "Type Safety for Content"
created-on: "2025-07-25T11:00:00Z"
updated-on: "2025-07-30T15:30:00Z"
image: "https://picsum.photos/seed/type-safety-for-content/1200/630"
author: "authors/lars-eriksson.json"
---

Type-safe content is one of those things you didn't know you needed until you had it for a week.

The shape:

```ts
const post = await getOnePost({ slug: "hello-world" });
//                                      ^? "hello-world" | "another-post" | ...

post.title;       // string
post.tags;        // string[]
post.nope;        // type error at compile time
```

That `slug` autocomplete is the killer feature. Every link in your site can be checked at build time — no broken internal links, ever.

Generating the types is the easy part:

1. Read every file in the collection.
2. Validate against the schema (catch typos in frontmatter).
3. Emit a union of slug literals.
4. Write a `.d.ts` file alongside `qino-lock.json`.

Same input, two outputs: one for the runtime, one for the editor.
