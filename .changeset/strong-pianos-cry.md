---
"@qino/cms": minor
---

Adds a `buildConfigFile` option to `initQino` and flattens its config. This is a breaking change.

#### Flat `initQino` config

`media.folder` becomes `mediaFolder` and `media.checkReferences` becomes `checkLocalAssetReferences`, with the same values and defaults:

```diff
 initQino({
   contentFolder: "src/content",
-  media: {
-    folder: "public",
-    checkReferences: { exclude: ["/og/**"] },
-  },
+  mediaFolder: "public",
+  checkLocalAssetReferences: { exclude: ["/og/**"] },
 });
```

#### `buildConfigFile`

When enabled, `qino build` also writes `qino/_generated/config.json`, a committable description of the project: config, every collection, item, and tree with its body format (`markdown`, `mdx`, or `null` for JSON), its schema as JSON Schema (draft 2020-12), and its relations. `qino check` fails when the committed file is missing or out of date.

```ts
export default initQino({
  contentFolder: "src/content",
  mediaFolder: "public",
  buildConfigFile: true,
});
```

Schemas are converted through Standard JSON Schema, which Zod 4.2+ implements. `qino build` fails when a schema can't be converted, when a transform renames or changes the value of a relation field or `titleField`, or when a relation targets a primitive that isn't exported from `qino/`.
