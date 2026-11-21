---
"@qino/cms": patch
---

Fixes `_stats` counting `{#id}` heading ids as words. A `{#id}` also stopped the body parsing as MDX, in `.md` files too, so it was counted as plain Markdown, text inside components and inline HTML included. Now `{#id}` is left out, as it already was in `_toc`, and the rest of the body counts as it does without one.
