---
"@qino/cms": minor
---

Adds `cli.build.llmsTxt`, which makes `qino build` write `llms.txt` at the root of `mediaFolder`, from a template you write:

```ts
initQino({ contentFolder: "content", mediaFolder: "public", siteUrl: "https://example.com", cli: { build: { llmsTxt: true } } });
```

The template, `content/llms.md` by default or the file `{ template }` names, holds your title, summary and "When to use" section. Its frontmatter is left out. qino adds a link section for each primitive that declares pages: one per tree root node, one per collection under its `pages.title` with the entries its default view keeps, and one `## Pages` section for the items. Sections go before the template's `## Optional` heading, or at the end, ordered trees, then collections, then items, each by path. Each link reads `- [title](Markdown URL): description`.

`qino build` also writes `index.md`, so the homepage has a Markdown URL: `llms.txt` after a frontmatter block, with the template's H1 as `title`, its summary blockquote on one line as `description`, and `siteUrl` as `canonical`. A template without an H1 gives `index.md` no block. The build skips `index.md` when a page already has `/index.md` as its Markdown URL, such as an item whose `page` is `/`. Both files are rewritten only when they change. The build fails when `siteUrl` is missing or the template doesn't exist.

On a large site, set `{ sections: true }` to keep `llms.txt` small. `qino build` then also writes a section llms.txt for each collection and tree that declares pages, at its index page's path, such as `public/docs/llms.txt`, listing only that primitive's pages. `llms.txt` links to them under one `## Sections` heading in place of their link sections, and keeps the items' `## Pages`:

```md
## Sections

- [Docs](https://example.com/docs/llms.txt)
- [Blog](https://example.com/blog/llms.txt)
```

A collection or tree with nothing to list still gets one, holding its heading alone. With `sections` on, the build fails for an index page at `/`, since its section llms.txt would replace `llms.txt`, and for two collections or trees with the same index page.
