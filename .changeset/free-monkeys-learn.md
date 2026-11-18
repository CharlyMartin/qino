---
"@qino/cms": patch
---

Fixes `getEntries` and `getPaginatedEntries` calls that run at the same time sharing entry objects. A top-level change to an entry in one call, such as `post.title = …`, showed up in every call that shared the listing. Each call now gets its own copy of each entry's top-level fields, as calls made one after another already did.
