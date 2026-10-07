---
label: Read the articles as typed entries with resolved authors
---

```ts
await postsCollection.getEntries();

// [
//   {
//     title: "Hello world",
//     author: { name: "Camille Laurent" },
//     _meta: { slug: "hello-world" },
//   },
//   {
//     title: "Typed content",
//     author: { name: "Jonas Weiss" },
//     _meta: { slug: "typed-content" },
//   },
// ]
```
