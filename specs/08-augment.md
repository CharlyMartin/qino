# Augment

**Status:** stable
**Version:** v1

## Intent

Some fields are derived, not authored. The classic case: a blurb generated from the markdown body, or a reading-time estimate. Qino should make derivation type-safe without the consumer reaching into raw frontmatter.

## API

```ts
import { createCollection } from "qino";
import { markdown } from "qino/utils";
import z from "zod";

export const { getMany, getOne } = createCollection({
  views: (view) => ({
    default: view({
      augment: (post) => {
        const content = markdown.stats(post.body);

        return {
          content,
          readingMinutes: Math.ceil(content.wordCount / 220),
        };
      },
    }),
  }),
  path: "posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    body: z.string(),
  }),
});
```

The returned entry has the schema fields **plus** the augment's return shape:

```ts
{
  _meta,
  title: string,
  body: string,
  content: {
    wordCount: number,
    proseCharacterCount: number,
    sourceCharacterCount: number,
  },                          // from augment
  readingMinutes: number,    // from augment
}
```

TypeScript should infer this without explicit annotations.

## Behaviour

- `augment` is available on collections, singletons, and trees. It applies to every hydrated entry returned by `getMany`, `getOne`, `getData`, or `getEntry`.
- `augment` runs after schema validation, `_meta` creation, and the selected view’s relation resolution. Its input type reflects that view’s fixed depth; with `resolveRelations` omitted or `false`, relation fields retain their authored values. Configure augmentation in `views.default` or a custom view; root augmentation is forbidden. See [15-views](./15-views.md).
- `augment` may be sync or async.
- Returned fields **merge** into the entry. Conflicts with schema fields or `_meta` are rejected both by TypeScript and at runtime, rather than silently overwriting data.
- `augment` runs once per hydrated entry per getter invocation, including collection entries later excluded by `filter`. No caching across calls in V1 — keep it simple.
- Embedded relation targets and CLI source validation never execute augment.
- Tree navigation nodes returned by `getTree` and `getFlatTree` remain structural and do not receive augmented fields.
- Augment errors include the source file path.

## Markdown stats

`markdown.stats(body)` is a pure helper exported from `qino/utils`. It parses Markdown, GFM, and MDX to calculate three stable, explicitly named values:

- `wordCount` — readable prose words, counted with `Intl.Segmenter`.
- `proseCharacterCount` — readable prose grapheme clusters after Markdown syntax and whitespace normalization.
- `sourceCharacterCount` — grapheme clusters in the original body string.

Readable prose includes headings, paragraphs, lists, quotes, table cells, and link labels. It excludes Markdown syntax, link destinations, images and alt text, inline and fenced code, raw HTML, and MDX expressions/components.

The helper first parses as MDX. If the body is not valid MDX, it falls back to Markdown with GFM support, where MDX expressions are treated as ordinary Markdown text. HTML comments (`<!-- ... -->`) are supported and excluded from prose counts; they remain part of `sourceCharacterCount`.

## Acceptance criteria

Done when:

- `augment` returns are merged into entries with correct TS types (no `as` casts in consumer code).
- Conflicting keys between an entry and augment output fail at compile time and runtime.
- `augment` errors point at the file that triggered them.
- `markdown.stats` has documented and tested Markdown-aware counting semantics.
