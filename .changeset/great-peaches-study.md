---
"@qino/cms": patch
---

Fixes `qino check` scanning `node_modules` for media references when `contentFolder` is `"."`. Trees also skip `node_modules` and dot-folders such as `.git`
