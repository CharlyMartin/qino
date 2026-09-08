# Transform

**Status:** stable
**Version:** v1

## Intent

Some fields are derived, not authored. The classic case: a blurb generated from the markdown body, or a reading-time estimate. Qino should make derivation type-safe without the consumer reaching into raw frontmatter.

## API

```ts
import { createCollection } from "qino";
import { markdown } from "qino/utils";
import z from "zod";

export const { getAll, getOne } = createCollection({
  path: "posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
  transform: (post) => {
    const content = markdown.stats(post.body);

    return {
      content,
      readingMinutes: Math.ceil(content.wordCount / 220),
    };
  },
});
```

The returned entry has the schema fields **plus** the transform's return shape:

```ts
{
  _meta,
  title: string,
  body: string,
  content: {
    wordCount: number,
    proseCharacterCount: number,
    sourceCharacterCount: number,
  },                          // from transform
  readingMinutes: number,    // from transform
}
```

TypeScript should infer this without explicit annotations.

## Behaviour

- `transform` is available on collections, singletons, and trees. It applies to every hydrated entry returned by `getAll`, `getOne`, `getData`, or `getEntry`.
- `transform` runs after schema validation and `_meta` creation, but before relation resolution. It receives the validated, typed entry including its `_meta` object; relation fields still hold their authored values.
- `transform` may be sync or async.
- Returned fields **merge** into the entry. Conflicts with schema fields or `_meta` are rejected both by TypeScript and at runtime, rather than silently overwriting data.
- `transform` runs once per `getAll` / `getOne` invocation. No caching across calls in V1 — keep it simple.
- Tree navigation nodes returned by `getTree` and `getFlatTree` remain structural and do not receive transformed fields.
- Transform errors include the source file path.

## Markdown stats

`markdown.stats(body)` is a pure helper exported from `qino/utils`. It parses Markdown, GFM, and MDX to calculate three stable, explicitly named values:

- `wordCount` — readable prose words, counted with `Intl.Segmenter`.
- `proseCharacterCount` — readable prose grapheme clusters after Markdown syntax and whitespace normalization.
- `sourceCharacterCount` — grapheme clusters in the original body string.

Readable prose includes headings, paragraphs, lists, quotes, table cells, and link labels. It excludes Markdown syntax, link destinations, images and alt text, inline and fenced code, raw HTML, and MDX expressions/components.

The helper first parses as MDX. If the body is not valid MDX, it falls back to Markdown with GFM support, where MDX expressions are treated as ordinary Markdown text. HTML comments (`<!-- ... -->`) are supported and excluded from prose counts; they remain part of `sourceCharacterCount`.

## Acceptance criteria

Done when:

- `transform` returns are merged into entries with correct TS types (no `as` casts in consumer code).
- Conflicting keys between an entry and transform output fail at compile time and runtime.
- `transform` errors point at the file that triggered them.
- `markdown.stats` has documented and tested Markdown-aware counting semantics.
