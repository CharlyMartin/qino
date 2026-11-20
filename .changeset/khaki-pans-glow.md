---
"@qino/cms": patch
---

Fixes `_stats` counting a heading's `{#id}` as words. In an MDX body, `{#id}` also made the whole body parse as plain Markdown, so the text inside components was counted too. Both are now left out, as they already were in `_toc`.
