---
title: "The Markdown Specification, Briefly"
created-on: "2025-10-08T14:00:00Z"
updated-on: "2025-10-08T14:00:00Z"
image: "https://picsum.photos/seed/the-markdown-specification-briefly/1200/630"
author: "authors/felix-berger.json"
---

There's no single Markdown spec. There are several, and they disagree in small but real ways.

The ones that matter today:

| Spec       | Year | Notes |
|------------|------|-------|
| Original   | 2004 | John Gruber's writeup. Loose, ambiguous in places. |
| CommonMark | 2014 | Tightened the spec, removed ambiguity. The default. |
| GFM        | 2017 | CommonMark + tables, task lists, strikethrough, autolinks. |
| MDX        | 2018 | Markdown + JSX. Different beast — see "The Trade-offs of MDX". |

If you're picking one today, **GFM is the right default**. It's CommonMark-compatible, supports the extensions people actually use, and is what GitHub, GitLab, and most static site generators speak.

The other thing to know: every parser has its own quirks. Don't write Markdown that depends on edge cases — write the boring middle of the spec and you'll be fine.
