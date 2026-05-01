---
title: "The Markdown Linter You Should Be Using"
created-on: "2026-02-08T09:00:00Z"
updated-on: "2026-02-14T13:30:00Z"
image: "https://picsum.photos/seed/the-markdown-linter-you-should-be-using/1200/630"
author: "authors/felix-berger.json"
---

Linting Markdown sounds excessive until you've spent an hour debugging why a heading isn't rendering. Then it sounds like the bare minimum.

`markdownlint` catches the boring stuff:

- Headings that skip levels (`#` → `###`).
- Trailing whitespace inside lists that breaks rendering.
- Inconsistent emphasis markers (`*` vs `_`).
- Links with empty text.

Most of these are invisible until they bite. The fix is to wire the linter into both your editor and your CI:

```bash
npx markdownlint-cli2 "content/**/*.md"
```

Five seconds in CI, hundreds of saved confused-author moments.

A reasonable config for a blog is permissive on line length and strict on heading structure. The opposite of what most people start with.
