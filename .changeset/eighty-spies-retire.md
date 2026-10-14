---
"@qino/cms": minor
---

Moves `checkLocalAssetReferences` on `initQino` to `cli.check.localAssetReferences`, so CLI options are namespaced by command. This is a breaking change:

```diff
 initQino({
   contentFolder: "src/content",
   mediaFolder: "public",
-  checkLocalAssetReferences: { exclude: ["/og/**"] },
+  cli: {
+    check: { localAssetReferences: { exclude: ["/og/**"] } },
+  },
 });
```
