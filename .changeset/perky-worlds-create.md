---
"@qino/tooling": minor
---

Adds `@qino/tooling`, schemas and helpers for tools built on Qino projects, like the Qino cloud UI. Requires `zod` 4 as a peer dependency.

- `parseConfigFile` validates a generated `qino/_generated/config.json`, dispatching on its `version`. `configFileSchema` and `type ConfigFile` are its zod schema and type.
- `getEntrySchema` builds a zod schema validating a primitive's entries, from the JSON Schema in `config.json`:

```ts
const { collections } = parseConfigFile(JSON.parse(file));
const posts = collections["posts"];
if (posts) getEntrySchema(posts).safeParse(frontmatter);
```
