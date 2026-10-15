---
"@qino/cms": minor
---

Adds `cli.build.types` to `initQino`. Set it to `false` to make `qino build` skip writing `qino/_generated/types.d.ts`. Defaults to `true`.

```ts
initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cli: { build: { types: false } },
});
```
