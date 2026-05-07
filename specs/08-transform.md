# Transform

**Status:** v1-proposed
**Version:** v1

## Intent

Some fields are derived, not authored. The classic case: a blurb generated from the markdown body, or a reading-time estimate. Qino should make derivation type-safe without the consumer reaching into raw frontmatter.

## API (proposed)

```ts
import { createCollection } from "qino";
import z from "zod";

export const { getAll, getOne } = createCollection({
  path: "posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
  }),
  transform: async (post) => ({
    blurb: stripMarkdown(post.markdown).slice(0, 160),
    readingMinutes: Math.ceil(wordCount(post.markdown) / 220),
  }),
});
```

The returned entry has the schema fields **plus** the transform's return shape:

```ts
{
  _meta,
  title: string,
  markdown: string,
  blurb: string,             // from transform
  readingMinutes: number,    // from transform
}
```

TypeScript should infer this without explicit annotations.

## Behaviour

- `transform` runs **after** schema validation. It receives the validated, typed entry.
- `transform` may be sync or async.
- Returned fields **merge** into the entry. Conflicts (`transform` returns a key already on the schema) are an error at build time, not silent overwrites.
- `transform` runs once per `getAll` / `getOne` invocation. No caching across calls in V1 — keep it simple.

## Open questions

- Should `transform` have access to other collections (e.g. to resolve a related entry inline)? Probably no in V1 — relations handle that.
- Order of operations vs `resolveDescendants`: transform first or resolve first? Default: resolve first, so transform can see resolved entries.
- Where do transform errors go — same channel as schema errors, with the file path?

## Acceptance criteria

Done when:

- `transform` returns are merged into entries with correct TS types (no `as` casts in consumer code).
- Conflicting keys between schema and transform fail at build time.
- `transform` errors point at the file that triggered them.
