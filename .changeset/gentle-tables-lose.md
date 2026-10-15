---
"@qino/cms": minor
---

Adds three cloud UI options, written to `qino/_generated/config.json`:

- `cloud.publish.reviewBeforePublish` on `initQino` also takes an object, which turns review on and configures it. Its `bypassIfAdmin` lets admins publish before every entry is approved, `false` by default. In `config.json`, `reviewBeforePublish` is now `false` or the review settings, `true` becoming `{ "bypassIfAdmin": false }`.
- `cloud.hiddenFields` on `defineCollection`, `defineTree`, and `defineItem` hides optional fields from the cloud UI. Required fields are a type error.
- `cloud.media.fields` marks the fields edited with a media picker, as relation paths to strings. A path that's also a relation fails `qino build`.

```ts
qino.defineCollection({
  directory: "posts",
  extension: ".md",
  schema,
  cloud: {
    hiddenFields: ["notes"],
    media: { fields: ["cover", "gallery[*]"] },
  },
});
```

`config.json` gains these keys, so run `qino build` and commit it, or `qino check` reports it as out of date.

Fixes `qino build` accepting a `sortableBy` field that's a string in one branch of a union schema but an array or object in another. Every branch must now allow only scalars.
