---
title: "Hot Reloading for Content"
created-on: "2025-06-23T10:00:00Z"
updated-on: "2025-06-28T16:00:00Z"
image: "https://picsum.photos/seed/hot-reloading-for-content/1200/630"
author: "authors/jane-doe.json"
---

Hot reloading isn't a developer feature. It's a *writing* feature.

Editing a paragraph and seeing it render in 200ms is the difference between writing in flow and writing in dread. Anything slower and you start avoiding edits — which means you publish drafts that you'd otherwise polish.

The implementation is unromantic:

```ts
const watcher = chokidar.watch("content/**/*.md");
watcher.on("change", (path) => {
  invalidate(path);
  rebuildAffectedPages(path);
  ws.broadcast({ type: "reload", path });
});
```

The trick is *incremental* — invalidate only what changed, rebuild only what depends on it. Full rebuilds on every keystroke are slow enough to break flow.
