---
title: "Reading Time, and Why It Matters"
created-on: "2026-01-30T10:00:00Z"
updated-on: "2026-01-30T10:00:00Z"
image: "https://picsum.photos/seed/reading-time-and-why-it-matters/1200/630"
author: "authors/hanna-voss.json"
categories:
  - "categories/tooling.json"
  - "categories/editorial.json"
---

"5 min read" is a tiny piece of UI that makes a surprising difference. It tells the reader, *before they commit*, what they're getting into.

The math is uncontroversial:

```ts
const WPM = 220; // average adult reading speed
const minutes = Math.ceil(wordCount / WPM);
```

Compute it at build time, store it on the post, render it next to the title. Done.

The trickier part is what *counts* as a word. Code blocks shouldn't — nobody reads them at 220 wpm. Captions and alt text shouldn't either. A proper implementation strips Markdown to its prose first, then counts.

It's a one-line feature with measurable impact on engagement. Cheap wins are still wins.
