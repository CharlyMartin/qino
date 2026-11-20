---
"@qino/cms": minor
---

Adds `cli.build.llmsTxt`, which makes `qino build` write `llms.txt` at the root of `mediaFolder`, from a template you write:

```ts
initQino({ contentFolder: "content", mediaFolder: "public", siteUrl: "https://example.com", cli: { build: { llmsTxt: true } } });
```

The template, `content/llms.md` by default or the file `{ template }` names, holds your title, summary and "When to use" section. qino adds a link section for each primitive that declares pages: one per tree root node, one per collection under its `pages.title` with the entries its default view keeps, and one `## Pages` section for the items. Sections go before the template's `## Optional` heading, or at the end, ordered trees, then collections, then items, each by path. Each link reads `- [title](Markdown URL): description`.

`qino build` also writes the same file as `index.md`, so the homepage has a Markdown URL. It skips `index.md` when an item's `page` or a collection's or tree's index page is `/`. The build fails when `siteUrl` is missing or the template doesn't exist.
