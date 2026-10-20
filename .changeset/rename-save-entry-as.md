---
"@qino/cms": minor
"@qino/tooling": minor
---

Renames `cloud.saveAs` to `cloud.saveEntryAs`, matching `displayEntryAs` and `media.saveFileAs`. `config.json` writes `saveEntryAs` too:

```diff
 cloud: {
   displayEntryAs: "{title}",
-  saveAs: "{title}",
+  saveEntryAs: "{title}",
 },
```
