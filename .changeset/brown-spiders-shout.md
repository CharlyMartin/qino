---
"@qino/cms": minor
---

Changes paths in `defineCollection`, `defineTree`, `defineItem`, and relation values to one convention: relative to `contentFolder`, with no leading `/`. A leading `/` is now a type error in definitions and a runtime error with a suggested fix. This is a breaking change:

```diff
- defineCollection({ directory: "/posts", ... });
- defineItem({ file: "/pages/home.md", ... });
+ defineCollection({ directory: "posts", ... });
+ defineItem({ file: "pages/home.md", ... });
```

```diff
- author: "/authors/jane.json"
+ author: "authors/jane.json"
```

A primitive at the content root uses `directory: ""` instead of `"/"`. Rerun `qino build` to regenerate `qino/_generated/types.d.ts`. `QinoSlugRegistry` keys are now `"posts"` instead of `"/posts"`.

Relation values can also be root paths that go through `contentFolder`, like `src/content/authors/jane.json` or `apps/site/src/content/authors/jane.json`. Repos edited with Git-based CMSs such as Decap CMS, which store paths from the repository root, keep working.
