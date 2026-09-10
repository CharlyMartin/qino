# qino

Flat-file Markdown CMS. See [`SPECS.md`](../../SPECS.md) for the design intent.

## Path validation

Run `qino lint` or `qino build` to detect duplicate or overlapping collection,
tree, and singleton paths. Importing definitions does not check path conflicts,
so hot reload can recreate definitions on the same Qino instance without stale
registrations. Include either command in your build or CI workflow to enforce
path ownership.

## Views

Collections, trees, and singletons can expose different shapes of the same content:

```ts
const qino = createQino({ contentFolder: "content", mediaFolder: "public" });

const authors = qino.createCollection({
  directory: "/authors",
  extension: ".json",
  schema: z.object({ name: z.string() }),
});

const posts = qino.createCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({ title: z.string(), body: z.string(), author: z.string() }),
  relations: { author: () => authors },
  views: {
    listing: {},
    detail: {
      resolveRelations: true,
      augment: (post) => ({ authorName: post.author.name }),
    },
  },
});

const listing = await posts.getAll({ view: "listing" }); // author is a path string
const detail = await posts.getOne("hello", { view: "detail" }); // author resolves; authorName exists
const defaults = await posts.getAll(); // top-level configuration
```

Import `createQino` from `qino` and `z` from `zod`. Authored relations use
content paths, such as `authors/alice.json`.

View names autocomplete. Each view independently defaults to
`resolveRelations: false` and no augment. Augment may be async and runs after
the selected view’s relation resolution. Without explicit resolution, both
getters and augment callbacks receive raw references. Embedded relation targets never include
their own augment fields.

Top-level `resolveRelations` and `augment` define the implicit default.
Omit `view` to select it; `"default"` is reserved and cannot be configured or
passed to a getter. Unknown names fail in TypeScript and at runtime.

Breaking change: getters no longer accept `resolveRelations`. Move each
override into a named view and select it with `{ view: "name" }`. Flat/default
augment callbacks now receive resolved relations when resolution is enabled.
Resolution now defaults to `false` for the implicit default and all named views.
If existing code requires expanded relations, add `resolveRelations: true` or a
numeric depth to that configuration.

## Relations

Collections, trees, and singletons can each reference any of the three types:

| Source → Target | Collection | Tree | Singleton |
| --------------- | ---------- | ---- | --------- |
| Collection      | Yes        | Yes  | Yes       |
| Tree            | Yes        | Yes  | Yes       |
| Singleton       | Yes        | Yes  | Yes       |

Declare a target directly or with a lazy function for forward references:

```ts
const docs = qino.createTree({
  directory: "/docs",
  extension: ".md",
  titleField: "title",
  schema: z.object({ title: z.string(), body: z.string() }),
});

const home = qino.createSingleton({
  file: "/home.json",
  schema: z.object({
    featuredDoc: z.string(),
    relatedDocs: z.array(z.string()),
  }),
  relations: { featuredDoc: docs, "relatedDocs[*]": () => docs },
  resolveRelations: 1,
});
```

In `home.json`, store references such as `"featuredDoc": "docs/guides/setup.md"`.
A tree target resolves to that file's content and `_meta` (including the nested
slug `guides/setup`), without children or navigation data. The directory and
extension must match the target; a leading `/` is optional. Singleton references
must match the singleton's configured file.

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
or run augment callbacks. Invalid content still has a slug. Empty or missing
directories return `[]`; hidden files and nested files are excluded.

Use `getAll()` / `getOne()` to read and validate content and apply views.
CLI validation uses the internal `readAll()` source reader without running views;
collection slug generation uses `getAllSlugs()` for filename discovery.
