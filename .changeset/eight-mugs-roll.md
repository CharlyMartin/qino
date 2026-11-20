---
"@qino/cms": patch
---

Fixes `qino build`, `qino check` and `qino lint` loading test files in `qino/`, which made them fail on a test that imports its runner, such as `vitest`. Files named `*.test.*`, `*.test-d.*` or `*.spec.*` are now skipped, so tests can sit beside the definitions they test.
