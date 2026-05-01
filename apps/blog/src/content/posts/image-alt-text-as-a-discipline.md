---
title: "Image Alt Text as a Discipline"
created-on: "2026-03-02T11:00:00Z"
updated-on: "2026-03-02T11:00:00Z"
image: "https://picsum.photos/seed/image-alt-text-as-a-discipline/1200/630"
---

Alt text is the most-skipped accessibility feature in the world. It's also the easiest one to fix, and the one with the highest payoff per minute spent.

A few principles that make alt text good:

- **Describe, don't editorialize.** "A red barn against a clear sky" is better than "A beautiful old red barn".
- **Skip "image of" or "picture of".** Screen readers already announce that.
- **Be brief.** One sentence, ideally fewer than 125 characters.
- **Decorative? Use empty alt.** `alt=""` tells screen readers to skip it. Better than nothing.

The discipline part is making it required. Add a schema rule that every image in a post must have alt text — including ones embedded inline with `![](url)`. The build fails if alt is empty (and not explicitly empty-on-purpose).

Once it's required, it gets done.
