---
"@qino/cms": patch
---

Fixes two relation bugs in `getEntries`, `getPaginatedEntries`, and `getEntry`:

- Relations to two primitives over the same directory, such as two collections that parse `people/` apart, resolved to whichever one was read first. Each relation now gets its own target's entry.
- When several entries referenced the same missing or invalid target, every error named the first entry that reached it. Each error now names its own entry and relation.
