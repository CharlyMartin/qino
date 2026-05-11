# Pages

**Status:** v1-proposed
**Version:** v1

## Intent

A page is a single, well-known content file with its own role in the consumer app — `pages/home.md`, `pages/about.md`. Distinct from a one-entry collection because:

- The file path is fixed and known at author time. There is no slug lookup.
- The schema is per-file, not per-folder.
- The cloud UI renders pages as named entries in the dashboard, not as rows in a table.

## API (proposed)

```ts
// qino/pages/home.ts
import { createPage } from "qino";
import z from "zod";

export const homePage = createPage({
  file: "pages/home.md", // relative to config.contentFolder
  schema: z.object({
    hero: z.object({
      title: z.string(),
      subtitle: z.string(),
    }),
    markdown: z.string(),
  }),
});
```

The returned getter is parameterless:

```ts
const home = await homePage.getData();
```

## Behaviour

- The file must exist at the declared path. Missing file → build-time error.
- `_meta` shape mirrors collections: `{ slug: undefined, fileName, filePath }`. Slug is `undefined` because pages have no slug.
- `.md` and `.mdx` parse via `gray-matter` and expose `markdown`. `.json` parses straight.

## Lock-file entry

```json
"pages": {
  "home": {
    "file": "pages/home.md",
    "extension": ".md"
  }
}
```

## Open questions

- Naming: `createPage` vs `createSingleton`?
- Should pages support relations to collections (e.g. "featured posts")? Likely yes — same Path API.
- Where should pages live on disk: under `contentFolder/pages/`, or anywhere the consumer wants?

## Acceptance criteria

Done when:

- `createPage` returns a typed `getOne`-like getter that validates frontmatter against the schema.
- Pages appear in `qino-lock.json` under `pages.<id>`.
- Missing page files fail at build time, not runtime.
