---
"@qino/cms": minor
---

Caches parsed files for trees and items, as collections already do. A file is parsed and validated again only once it changes.

- `getTree`, `getFlatTree`, `getAncestorNodes`, `getNextNode` and `getPreviousNode` share each file's cached parse with `getEntry` and `getEntries`. A docs page that renders a sidebar, previous and next links, and its own entry no longer re-reads and re-validates the whole tree on every call.
- Stats and the table of contents are built once per parse, and tree walks never build them.
- As with collections, tree and item entries can share nested objects between calls, so treat them as read-only. A schema transform that reads data outside its own file runs again only when that file changes.
