---
label: Declare relations between content models
---

```ts
const postCollection = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    categories: z.array(z.string()),
    tags: z.array(z.string()),
  }),
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
    "tags[*]": tagCollection,
  },
  views: (view) => ({
    default: view({ resolveRelations: 1 }),
  }),
});
```
