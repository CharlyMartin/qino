---
"@qino/cms": minor
---

Adds a `raw` field to Markdown entries holding the untouched source file, frontmatter included. Declare it in the schema to keep it:

```ts
schema: z.object({ title: z.string(), markdown: z.string(), raw: z.string() });
```

`raw` is now reserved on Markdown entries: it cannot appear in frontmatter or be added by `augment`. Strict schemas (`z.strictObject`) must declare it:

```diff
  z.strictObject({
    markdown: z.string(),
+   raw: z.string(),
  })
```
