---
"@qino/cms": patch
---

Shares work between calls that run at the same time, such as the pages a static build renders at once.

- `getEntries` and `getPaginatedEntries` calls for the same view share one listing, so the entries are resolved, filtered, and sorted once instead of once per call. Each call still gets its own array.
- Tree walks share one walk, so a page that calls `getTree`, `getPreviousNode`, and `getNextNode` together lists its files once. Each call still gets its own nodes.
- A call that starts while another is running gets that run's result, so an edit made during it shows up from the next call on.
- Tree walks read a folder's files and subfolders at the same time instead of one by one. When several files are invalid, the walk still throws the same error as before.
- Reads at most 64 content files at once, across trees, collections, items, and `qino check`. On Node 22, a tree or collection of more than about 1,000 files could fail with `EMFILE` under a 1,024 open-file limit, as on AWS Lambda.
