---
"@qino/cms": minor
---

Renames collection and item getters so every primitive reads entries with `getEntry`. This is a breaking change:

```diff
- await posts.getMany();
- await posts.getOne("hello-world");
- await home.getData();
+ await posts.getEntries();
+ await posts.getEntry("hello-world");
+ await home.getEntry();
```
