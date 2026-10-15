---
"@qino/cms": minor
---

Adds `cloud.saveAs` to `defineCollection` and `defineTree`: how the cloud UI names the file of a new entry, from its fields. It uses the same `{token}` syntax as `media.saveAs`, with top-level fields as tokens:

```ts
qino.defineCollection({
  directory: "authors",
  extension: ".json",
  schema,
  cloud: { saveAs: "{firstName}-{lastName}" }, // jane-doe.json
});
```

Tokens must be required string, number, or boolean fields. An unknown or optional field, a `/` or `.`, or a pattern without a token is a type error, and `qino build` checks the same rules.
