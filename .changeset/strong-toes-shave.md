---
"@qino/cms": patch
---

Fixes `qino check` and `qino build` failing with "Could not parse expression with acorn" on an `.mdx` file with a `{#id}` heading id, while scanning for missing media.
