---
"@qino/tooling": minor
---

Fixes `extractMediaLinks` and `extractMediaCandidates` throwing on an MDX body with a `{#id}` heading id, which MDX took for an invalid expression. They now read it as qino does. Also adds `micromarkHeadingId()`, from `@qino/tooling/markdown`, the micromark extension that tokenizes `{#id}`: add it after `mdxjs()`.
