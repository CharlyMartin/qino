---
"@qino/cms": minor
---

Changes `qino build` to check `qino/_generated/config.json` instead of rewriting it when the `CI` environment variable is set, as on GitHub Actions and Vercel. With `cloud` set, a stale or missing committed `config.json` now fails the build with the same error as `qino check`, so CI runs and deploys catch a schema change that wasn't rebuilt and committed, with no extra step. This is a breaking change for builds that relied on CI regenerating the file: run `qino build` locally and commit `config.json`, or set `CI=false` for a command that should rewrite it.
