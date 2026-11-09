---
label: Define an articles collection
---

```ts
const postsCollection = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: PostSchema,
  relations: {
    author: authorsCollection,
  },
})
```
