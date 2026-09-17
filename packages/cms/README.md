# qino

Flat-file Markdown CMS. Requires Node.js 22 or newer. TypeScript is optional; if you use it, 5.9 or newer with `strict: true`.

## Path validation

Run `qino lint` or `qino build` to detect duplicate or overlapping collection,
tree, and item paths. Importing definitions does not check path conflicts,
so hot reload can recreate definitions on the same Qino instance without stale
registrations. Include either command in your build or CI workflow to enforce
path ownership.

## Reserved entry fields

Qino supplies the raw Markdown or MDX body, excluding frontmatter, as a
`markdown` string before schema validation. Declare `markdown: z.string()`
to retain it, or use a synchronous schema transform to change its value and
output type. Getters, views, and resolved relations follow the schema output.
An empty body is supplied as an empty string.

Undeclared fields follow the validator's behavior: ordinary Zod objects strip
`markdown`, passthrough objects retain it, and strict objects reject it unless
declared. Schemas remain required, including for documents without frontmatter.

Top-level `_meta` remains reserved in content and schema input/output for every
format. Markdown frontmatter cannot declare `markdown`. Augmentation cannot add
or replace `markdown` on Markdown entries, even if the schema omits it; it may
derive other fields. JSON `markdown` and nested names remain ordinary user fields.

To upgrade, rename an old `body` schema declaration to `markdown` and use
`entry.markdown`. Qino does not generate a `body` alias.

## Frontmatter

Markdown and MDX files may start with a YAML block delimited by `---` lines.
Qino parses it with [js-yaml](https://github.com/nodeca/js-yaml) using the
YAML 1.2 core schema, then validates the result against your entry schema.
The block must be a single mapping of field names to values. An empty or
comment-only block yields `{}`. A scalar, a list, or several `---` documents
at the top level is an error.

Unquoted values resolve by shape:

| YAML                                   | JavaScript           |
| -------------------------------------- | -------------------- |
| `true`, `false` (any case)             | boolean              |
| `null`, `~`, `Null`, or an empty value | `null`               |
| `42`, `-7`, `0x1F`, `0o17`, `017`      | number (`017` is 17) |
| `1.5`, `1e3`, `.inf`, `.nan`           | number               |
| `[a, b]` or a `-` list                 | array                |
| `{a: 1}` or an indented block          | plain object         |
| anything else                          | string               |

YAML 1.1 forms are not resolved. `yes`, `no`, `on`, `off`, `12:34:56`,
`1_000`, and `0b11` stay strings. Quote a value when you want to force a
string, such as `zip: "01234"`.

Dates are never converted. `2023-11-14` and `2023-11-14T12:34:56Z` arrive as
strings, so validate them with `z.iso.date()` or coerce with
`z.coerce.date()`. To receive a `Date` directly, tag the value explicitly:

```yaml
published: !!timestamp 2023-11-14
```

Anchors, aliases, and merge keys are supported. Use `&name` to define a node,
`*name` to reuse it, and `<<` to copy a mapping's keys into another one. Keys
written directly win over merged ones:

```yaml
defaults: &defaults
  draft: false
  layout: post

article:
  <<: *defaults
  title: Hello
```

Duplicate keys in a mapping are an error. Custom tags such as `!foo` and the
YAML 1.1 collection tags `!!binary`, `!!set`, `!!omap`, and `!!pairs` are not
recognized and raise an error. The built-in `!!str`, `!!int`, `!!float`,
`!!bool`, and `!!null` tags work as expected.

## Views

Collections, trees, and items can expose different shapes of the same content:

```ts
const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

const authors = qino.defineCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});

const posts = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    author: z.string(),
    markdown: z.string(),
  }),
  relations: { author: () => authors },
  views: (view) => ({
    default: view({}),
    listing: view({}),
    detail: view({
      resolveRelations: true,
      augment: (post) => ({ authorName: post.author.name }),
    }),
  }),
});

const listing = await posts.getMany({ view: "listing" }); // author is a path string
const detail = await posts.getOne("hello", { view: "detail" }); // author resolves; authorName exists
const defaults = await posts.getMany(); // declared default view
const same = await posts.getMany({ view: "default" });
```

Import `createQino` from `@qino/cms` and `z` from `zod`. Authored relations use
content paths, such as `authors/alice.json`.

View names autocomplete. Each view independently defaults to
`resolveRelations: false` and no augment. Augment may be async and runs after
the selected view’s relation resolution. Without explicit resolution, both
getters and augment callbacks receive raw references. Embedded relation targets never include
their own augment fields.

`views` is optional. Without it, getters return validated entries with raw relation
references and no augmentation, filtering, or sorting. When supplied, the factory
must include `default: view({ ... })`. Omit the getter's `view` option or select
`{ view: "default" }` to use it. Unknown names fail in TypeScript and at runtime.

Breaking change: `resolveRelations`, `augment`, `filter`, and `sort` are no longer
allowed at the root. Move existing settings into `views.default`. Existing factories
must add a default view; use `default: view({})` for baseline behavior. Getters
accept view selection only, with no per-call resolution or callback overrides.

### Inferring output types

Use the type-only `Infer` helper with a collection, tree, or item:

```ts
import type { Infer } from "@qino/cms";

type PostTypes = Infer<typeof posts>;
type Post = PostTypes["output"];
type DetailPost = PostTypes["views"]["detail"];
```

Outputs match getter results, including schema transformations, resolved
relations, awaited augmentation, and `_meta`. Each output describes one content
entry; use `Array<Post>` for a list. `views` contains every declared name, including
`default`, whose output equals `output`. Without configured views, `output` is the
baseline entry and the `views` mapping is empty.
The descriptor exists only in TypeScript.

### Required view helpers

All three primitives require the same helper syntax for custom views:

```ts
// Before (no longer supported)
views: {
  detail: { resolveRelations: 1 },
}

// After
views: (view) => ({
  default: view({}),
  detail: view({ resolveRelations: 1 }),
  empty: view({}),
})
```

When supplied, the factory must synchronously return a default view and any
custom views, each created by the helper. It runs once during primitive creation.
Legacy object-form views and unwrapped definitions fail in TypeScript and at runtime.

The supplied helper exposes only the options supported by its primitive:

| Option             | Collection | Tree | Item |
| ------------------ | ---------- | ---- | ---- |
| `resolveRelations` | Yes        | Yes  | Yes  |
| `augment`          | Yes        | Yes  | Yes  |
| `filter`           | Yes        | No   | No   |
| `sort`             | Yes        | No   | No   |

Tree and item helpers omit filter and sort from autocomplete and reject them
in TypeScript and at runtime. Tree sorting still uses `_order.json`; tree filtering
remains future work. Each helper infers its primitive's schema, metadata, resolved
relations, and augmented fields. Views inherit no sibling settings, including those of `default`.

### Reusable views

Create a local base with the supplied helper and spread it into another view.
No type annotations are needed; ordinary spread ordering controls overrides:

```ts
import { createQino } from "@qino/cms";
import { getMarkdownStats } from "@qino/cms/utils";
import { z } from "zod";

const qino = createQino({ contentFolder: "content", mediaFolder: "public" });
const posts = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
    highlight: z.boolean(),
  }),
  views: (view) => {
    const base = view({
      augment: (post) => ({ stats: getMarkdownStats(post.markdown) }),
      sort: (a, b) => b.stats.wordCount - a.stats.wordCount,
    });
    return {
      default: base,
      highlight: view({ ...base, filter: (post) => post.highlight }),
    };
  },
});

const entries = await posts.getMany({ view: "highlight" });
// entries[number].stats.wordCount is inferred as number.
```

Spreading preserves the base's settings; independent `view({})` calls start from
baseline behavior. TypeScript checks callback compatibility when overriding
settings such as relation depth. Tree and item helpers support the same
reuse pattern for resolution and augmentation.

Spread replaces callbacks; it does not compose them or merge their outputs.
For example, inside the factory above:

```ts
const summaries = view({
  ...base,
  augment: (post) => ({ titleLength: post.title.length }),
  filter: undefined,
  sort: undefined,
});
// summaries produces titleLength, not the base's stats.
```

Use `filter: undefined` or `sort: undefined` to clear copied callbacks. Here both
are cleared because the replacement augmentation supplies a different shape.

Explicit `undefined` in getter options is treated as omission, including when
options are spread. Actual per-call resolution, filter, and sort overrides still
throw. Runtime checks likewise ignore undefined filter/sort values in tree and
item definitions while rejecting any supplied value, including `null`.

## Collection filtering and sorting

Configure synchronous `filter(entry): boolean` and `sort(a, b): number` callbacks
inside a collection view. Filtering runs after relation resolution and
augmentation for both `getMany()` and `getOne()`. Sorting follows filtering for
`getMany()` only.

```ts
const posts = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
    draft: z.boolean(),
  }),
  views: (view) => ({
    default: view({
      augment: (entry) => ({ titleLength: entry.title.length }),
      filter: (entry) => !entry.draft,
      sort: (a, b) => a.titleLength - b.titleLength,
    }),
    alphabetical: view({
      augment: (entry) => ({ label: entry.title.toLowerCase() }),
      filter: (entry) => !entry.draft && entry.label.length > 0,
      sort: (a, b) => a.label.localeCompare(b.label),
    }),
    all: view({}),
  }),
});

await posts.getMany(); // Default filter and sort.
await posts.getMany({ view: "alphabetical" }); // Independent view callbacks.
await posts.getMany({ view: "all" }); // Every entry, in discovery order.
```

The `view` helper preserves inference for augmented fields and resolved relations
without annotations. The factory runs once at collection creation. Every custom
view must use the helper, including views that only resolve or augment entries. Custom views are independent
and inherit neither default callbacks nor augmentation.

Filtering retains matching entries; sorting uses native `toSorted` comparator
semantics, preserving relative order for ties. Without callbacks, all entries
remain in discovery order. Callback errors reject the read.

`getOne(slug, { view })` throws if the selected view’s filter excludes the entry.
The error names the slug, collection, and view. Omitting `view` uses the default
filter; an independent view without a filter can read every entry.
Slug discovery, CLI validation, and relation loading bypass both callbacks. Getters accept view selection, not
filter or sort overrides. Trees keep `_order.json` ordering; tree filtering is
future work. Items have neither callback.

## Relations

Collections, trees, and items can each reference any of the three types:

| Source → Target | Collection | Tree | Item |
| --------------- | ---------- | ---- | ---- |
| Collection      | Yes        | Yes  | Yes  |
| Tree            | Yes        | Yes  | Yes  |
| Item            | Yes        | Yes  | Yes  |

Declare a target directly or with a lazy function for forward references:

```ts
const docs = qino.defineTree({
  directory: "/docs",
  extension: ".md",
  titleField: "title",
  schema: z.object({ title: z.string() }),
});

const home = qino.defineItem({
  views: (view) => ({
    default: view({
      resolveRelations: 1,
    }),
  }),
  file: "/home.json",
  schema: z.object({
    featuredDoc: z.string(),
    relatedDocs: z.array(z.string()),
  }),
  relations: { featuredDoc: docs, "relatedDocs[*]": () => docs },
});
```

In `home.json`, store references such as `"featuredDoc": "docs/guides/setup.md"`.
A tree target resolves to that file's content and `_meta` (including the nested
slug `guides/setup`), without children or navigation data. The directory and
extension must match the target; a leading `/` is optional. Item references
must match the item's configured file.

Relations resolve only when enabled on the source's default or named view.
Numeric depths allow 1–6 relation hops; `true` means 6. Embedded targets bypass
their own views and augment callbacks. All related primitives must belong to the
same `createQino()` instance. Relations are directional; reverse links are not
created automatically.

## Collection slugs

```ts
const slugs = await posts.getAllSlugs(); // ["hello", "second-post"]
```

`getAllSlugs()` discovers filenames in the collection's flat directory, strips
the configured trailing extension, and sorts the slugs using `.sort()`. It returns
`Promise<Array<SlugFor<Dir>>>`, using generated slug types when available.
It takes no options and does not read content, validate schemas, resolve relations,
or run augment, filter, or sort callbacks. Invalid content still has a slug. Empty or missing
directories return `[]`; hidden files and nested files are excluded.

Use `getMany()` / `getOne()` to read and validate content and apply views.
CLI validation uses the internal `readAll()` source reader without running views;
collection slug generation uses `getAllSlugs()` for filename discovery.

Because `getAllSlugs()` ignores views, it can list slugs that a filtering view
excludes, and `getOne(slug)` throws for those. Use `getAllSlugs()` for routes
(e.g. `generateStaticParams`) when the default view has no `filter`. Otherwise
derive slugs from the viewed set:

```ts
const slugs = (await posts.getMany({ view })).map((entry) => entry._meta.slug);
```
