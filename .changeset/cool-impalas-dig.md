---
"@qino/cms": patch
---

Improves the first listing call under `next dev` for collections and trees with `markdown.stats` or `markdown.toc`. `next dev` loads the development build of the Markdown parser, which runs several times slower, so qino now ships the parser's production build bundled into its own. Counting characters for `_stats` is also faster. On 10,000 posts with `markdown.stats`, the first call drops from about 16 s to about 11 s.

Installing `@qino/cms` no longer installs `unified`, `remark-parse`, `remark-gfm`, `remark-mdx`, or the `mdast-util-*` and `micromark-extension-*` packages. A project that imports any of them without listing it in its own `package.json` needs to add it. The bundled packages' licenses ship in `dist/THIRD-PARTY-LICENSES.md`.
