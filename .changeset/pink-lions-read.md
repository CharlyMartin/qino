---
"@qino/cms": minor
---

Adds `llms-full.txt` to what `qino build` writes with `cli.build.llmsTxt` on, at the root of `mediaFolder`, so an agent can read every entry page in one request. It opens with the template's H1 and the summary blockquote after it. Then comes the agent Markdown of every entry page that `llms.txt` links to, in the same order and exactly as its Markdown URL serves it, one blank line apart. Entries the default view excludes are left out. Set `pages.llmsFull: false` to keep a collection or a tree out, such as a very large one:

```ts
qino.defineCollection({
  directory: "changelog",
  extension: ".md",
  schema,
  pages: { index: "/changelog", entry: "/changelog/{slug}", title: "Changelog", llmsFull: false },
});
```
