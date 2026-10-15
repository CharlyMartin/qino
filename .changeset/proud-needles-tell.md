---
"@qino/cms": minor
---

**Breaking:** `media.saveAs` no longer takes the extension, like an entry's `saveAs`: the cloud UI adds the uploaded file's. The `{ext}` token is gone, and the default is now `"{id}/{name}-{hash}"`. `qino build` fails on a `.` in the file name.

To upgrade, remove `.{ext}` from `media.saveAs`, then rerun `qino build` and commit `config.json`:

```diff
- media: { saveAs: "posts/{name}-{hash}.{ext}" },
+ media: { saveAs: "posts/{name}-{hash}" },
```
