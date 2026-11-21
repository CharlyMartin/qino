---
"@qino/cms": patch
---

Fixes reading entries with image fields on serverless hosts, which ship neither `mediaFolder` nor sharp's native binary: `qino build` now records each image in `.qino/images.json` inside the content folder, and a read falls back to it when the file is missing or sharp can't load
