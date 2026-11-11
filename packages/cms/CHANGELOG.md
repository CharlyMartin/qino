# @qino/cms

## 0.20.0

### Minor Changes

- [#310](https://github.com/CharlyMartin/qino/pull/310) [`93fc7f2`](https://github.com/CharlyMartin/qino/commit/93fc7f2932bcc344d1314a02c27633adfb1fbf5d) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Groups the Markdown body options under `markdown`, the name of the field that holds the body. `media` now only holds frontmatter fields. This is a breaking change: `markdownStats`, `markdownToc`, and `media.markdown` are gone.

  ```ts
  // Before
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: PostSchema,
    markdownStats: true,
    markdownToc: { upTo: "h3" },
    media: {
      cover: { accepted: "image/webp", maxSize: "5MB" },
      markdown: [{ accepted: "image/webp", maxSize: "1MB" }],
    },
  });

  // After
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: PostSchema,
    media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
    markdown: {
      stats: true,
      toc: { upTo: "h3" },
      media: [{ accepted: "image/webp", maxSize: "1MB" }],
    },
  });
  ```

  `markdown.media` takes one rule or a list. Each body rule can now have a `parse`, like a media field: `qino check` reads each image with every rule's own `parse`, and the image passes when one rule matches. The body itself is still read as written.

  Any `markdown` on a JSON primitive is a type error, and throws at definition. `media.markdown` throws with a pointer to `markdown.media`. `config.json` is unchanged: body rules are still listed under `media.markdown`.

  The `MediaRule`, `MediaSize`, and `MarkdownConfig` types are exported.

## 0.19.0

### Minor Changes

- [#307](https://github.com/CharlyMartin/qino/pull/307) [`bb31cab`](https://github.com/CharlyMartin/qino/commit/bb31cab4511176be15b6e32312aed57db01bed3e) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `markdownToc` to Markdown and MDX collections, trees, and items. It adds a `_toc` field to each entry: the body's headings in document order, as `{ heading, id, text }`. The ids match the ones `rehype-slug` gives the rendered headings. Set `true` to list every heading, or `{ upTo: "h3" }` to stop at a level:

  ```ts
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".mdx",
    schema: DocSchema,
    titleField: "title",
    markdownToc: { upTo: "h3" },
  });

  (await docs.getEntry("install"))._toc;
  // [{ heading: 2, id: "requirements", text: "Requirements" }, …]
  ```

  A heading ending in `{#id}` keeps that id, as with `remark-custom-heading-id`. For sites that make ids their own way, `slug` turns each heading's text into its id:

  ```ts
  markdownToc: { upTo: "h4", slug: (text) => text.replace(/[^a-zA-Z0-9]/g, "") },
  ```

  `text` leaves out MDX components, so ``## `watch`: <TypeText>() => T</TypeText>`` reads `watch:`.

  `_toc` is now reserved in Markdown schemas and frontmatter, like `_stats`. The `MarkdownToc` and `MarkdownTocHeading` types are exported.

## 0.18.0

### Minor Changes

- [#291](https://github.com/CharlyMartin/qino/pull/291) [`5760940`](https://github.com/CharlyMartin/qino/commit/57609403a7185c4b2be5ad2dc18e05d2455eb2a8) Thanks [@{](https://github.com/{)! - Changes how relations resolve: declared relations now resolve by default, each relation sets its own depth, and views set depths by relation with `resolveDepth`, which replaces `resolveRelations`. This is a breaking change.

  #### Relations resolve by default

  Views used to leave relations as strings unless they set `resolveRelations`. Now every view, including the implicit default, resolves each relation to its `resolveDepth`, which defaults to `1`: `post.author` is the author entry, and the author's own relations stay strings. To keep a relation a string everywhere, declare it with `resolveDepth: 0`.

  #### `resolveDepth` on relations

  A relation can be declared as an object to set how many hops it resolves, from `0` (keep the string) to `6`:

  ```ts
  relations: {
   target: authorCollection, resolveDepth: 2 },
    related: { target: () => postCollection, resolveDepth: 0 },
  },
  ```

  A nested relation never resolves further than the hops left from its parent.

  #### `resolveDepth` in views replaces `resolveRelations`

  A view sets the depth of the relations it lists, keyed by relation path. Relations it leaves out use their own `resolveDepth`, and a depth the view sets applies to the whole branch below that relation. A path that isn't a relation, or a depth outside `0` to `6`, is a type error and throws at definition:

  ```diff
  - detail: view({ resolveRelations: 2 }),
  + detail: view({ resolveDepth: { author: 2 } }),
  - raw: view({ resolveRelations: false }),
  + raw: view({ resolveDepth: { author: 0, "categories[*]": 0 } }),
  - full: view({ resolveRelations: true }),
  + full: view({ resolveDepth: { author: 6, "categories[*]": 6 } }),
  ```

  `view()` throws when given `resolveRelations`, and getters throw on `resolveDepth` as they did on `resolveRelations`: select a view instead.

- [#292](https://github.com/CharlyMartin/qino/pull/292) [`7d5f883`](https://github.com/CharlyMartin/qino/commit/7d5f883f95587f6c635cb64b98bd7addf5c6a1d9) Thanks [@{](https://github.com/{)! - Adds `parse` to relations and media fields, to read content that can't follow qino's path conventions, such as an Obsidian vault linking notes with `[[Jane Doe]]`. `parse` turns a raw value into a content path or a media URL, which qino then checks and reads as usual. Return `undefined` to read the value as is:

  ```ts
  relations: {

      target: authorCollection,
      parse: (value, { target }) => {
        const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
        if (!name || target.is == "item") return undefined;
        return `${target.directory}/${name}${target.extension}`;
      },
    },
  },
  media: {
    cover: {
      accepted: "image/png",
      maxSize: "5MB",
      parse: (value) => {
        const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
        return name ? `/${encodeURIComponent(name)}` : undefined;
      },
    },
  },
  ```

  A media field's parsed URL replaces its value, including `QinoImage.src`, and `qino check` checks it. The `RelationParse` and `MediaParse` types are exported for callbacks declared on their own.

## 0.17.1

### Patch Changes

- [#286](https://github.com/CharlyMartin/qino/pull/286) [`9fc3bbb`](https://github.com/CharlyMartin/qino/commit/9fc3bbbb5402a52475cb51b8e974a000d6f76ba7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `qino check` scanning `node_modules` for media references when `contentFolder` is `"."`. Trees also skip `node_modules` and dot-folders such as `.git`

## 0.17.0

### Minor Changes

- [#278](https://github.com/CharlyMartin/qino/pull/278) [`091c7ed`](https://github.com/CharlyMartin/qino/commit/091c7ed59ba12d38fd415d7d35914931e63c46fe) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `getEntries` and `getAncestorNodes` to trees. `getEntries` reads every entry in reading order with the selected view, for sitemaps, search indexes, and feeds. `getAncestorNodes` returns the nodes above a slug, from the root down, for breadcrumbs:

  ```ts
  const entries = await docsTree.getEntries();
  const ancestors = await docsTree.getAncestorNodes(
    "guides/mutations/optimistic",
  );
  // TreeNodes for "guides" and "guides/mutations"
  ```

## 0.16.0

### Minor Changes

- [#265](https://github.com/CharlyMartin/qino/pull/265) [`845e573`](https://github.com/CharlyMartin/qino/commit/845e5732d44dc016a219e616da91dcf87b245aaa) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `markdownStats` option to `defineCollection`, `defineTree`, and `defineItem`. On Markdown and MDX primitives, `markdownStats: true` adds a typed `_stats` field (`wordCount`, `proseCharacterCount`, `sourceCharacterCount`) to every entry, related entries included. The Markdown parsers only load when it's on. `MarkdownStats` is now exported from `@qino/cms`.

  Removes `@qino/cms/utils` and `getMarkdownStats`. `_stats` is now reserved in Markdown frontmatter and schemas. This is a breaking change:

  ```diff
  - import { getMarkdownStats } from "@qino/cms/utils";
  -
    export const postCollection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: PostSchema,
  +   markdownStats: true,
      views: (view) => ({
        default: view({
  -       augment: (post) => {
  -         const stats = getMarkdownStats(post.markdown);
  -         return { readingMinutes: Math.ceil(stats.wordCount / 220) };
  -       },
  +       augment: (post) => ({
  +         readingMinutes: Math.ceil(post._stats.wordCount / 220),
  +       }),
        }),
      }),
    });
  ```

## 0.15.0

### Minor Changes

- [#259](https://github.com/CharlyMartin/qino/pull/259) [`1179ac6`](https://github.com/CharlyMartin/qino/commit/1179ac658f0998399ca924a297bca1e510acc513) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames `cloud.saveAs` to `cloud.saveEntryAs`, matching `displayEntryAs` and `media.saveFileAs`. `config.json` writes `saveEntryAs` too:

  ```diff
   cloud: {
     displayEntryAs: "{title}",
  -  saveAs: "{title}",
  +  saveEntryAs: "{title}",
   },
  ```

## 0.14.0

### Minor Changes

- [#257](https://github.com/CharlyMartin/qino/pull/257) [`dd61b16`](https://github.com/CharlyMartin/qino/commit/dd61b1638c534a774a9317422f1033afd9fad8d8) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `media` option to `defineCollection`, `defineTree`, and `defineItem`. It declares media fields by path, each with one accepted MIME type and a `maxSize`. Image fields are now read as a `QinoImage`, with `width`, `height`, and a blur placeholder, ready for `next/image`:

  ```ts
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    media: {
      cover: { accepted: "image/webp", maxSize: "5MB" },
      markdown: [
        { accepted: "image/webp", maxSize: "1MB" },
        { accepted: "image/png", maxSize: "1MB" },
      ],
    },
  });

  const post = await posts.getEntry("hello");
  <Image src={post.cover} alt="" placeholder="blur" />;
  ```

  `markdown` lists the rules body images must match, one type per rule. `qino check` verifies every media field and body image: a file in `mediaFolder`, of the accepted type, under its `maxSize`. Images are read with sharp, loaded only when an entry has an image field.

  This is a breaking change. Media config moves out of `cloud`:

  - `initQino`'s `cloud.media` is removed.
  - A primitive's `cloud.media.fields` and `cloud.media.accepted` are replaced by the top-level `media`.
  - `cloud.media.saveAs` is renamed `cloud.media.saveFileAs`, and takes a new `{field}` token.

  ```diff
   initQino({
     contentFolder: "src/content",
     mediaFolder: "public",
     cloud: {
       publish: { mode: "open_pull_request", reviewBeforePublish: true },
  -    media: { accepted: [{ type: "image/webp", maxSize: "5MB" }] },
     },
   });

   qino.defineCollection({
     directory: "posts",
     extension: ".md",
     schema,
  +  media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
     cloud: {
  -    media: { saveAs: "posts/{name}-{hash}", fields: ["cover"] },
  +    media: { saveFileAs: "posts/{name}-{hash}" },
     },
   });
  ```

  `cover` is now a `QinoImage`; read its URL from `cover.src`. In `config.json`, each primitive lists its `media` with sizes in bytes, and `cloud.media` holds only `saveFileAs`. The `@qino/tooling` schemas match.

  Also fixes reading an entry whose relation array is `null`, such as `categories: null` with a `"categories[*]"` relation: it now stays `null` instead of throwing.

## 0.13.1

### Patch Changes

- [#249](https://github.com/CharlyMartin/qino/pull/249) [`1481086`](https://github.com/CharlyMartin/qino/commit/14810863ec84497684526069dedb8d2c34f84286) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Replaces the `fast-glob` dependency with `tinyglobby`, dropping `braces` (GHSA-vfj7-8cjw-p6xm) from the dependency tree

## 0.13.0

### Minor Changes

- [#229](https://github.com/CharlyMartin/qino/pull/229) [`27d7940`](https://github.com/CharlyMartin/qino/commit/27d794096c09ee746e443418304e5417a7c4949d) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds two optional `cloud` options for naming things in the cloud UI, both written to `config.json`:

  - `displayAs` names the primitive itself, such as `"Blog posts"`. It's a plain string and defaults to the id. An item is a single entry, so this also names its entry.
  - `displayEntryAs` labels each entry of a collection or tree from its fields, using the same `{field}` tokens as `saveAs`. Unset, collections show the slug and trees fall back to `titleField`.

  ```ts
  qino.defineCollection({
    directory: "authors",
    schema,
    extension: ".json",
    cloud: {
      displayAs: "Authors",
      displayEntryAs: "{firstName} {lastName}",
    },
  });
  ```

## 0.12.0

### Minor Changes

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - **Breaking:** `media.saveAs` no longer takes the extension, like an entry's `saveAs`: the cloud UI adds the uploaded file's. The `{ext}` token is gone, and the default is now `"{id}/{name}-{hash}"`. `qino build` fails on a `.` in the file name.

  To upgrade, remove `.{ext}` from `media.saveAs`, then rerun `qino build` and commit `config.json`:

  ```diff
  - media: { saveAs: "posts/{name}-{hash}.{ext}" },
  + media: { saveAs: "posts/{name}-{hash}" },
  ```

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `cloud.saveAs` to `defineCollection` and `defineTree`: how the cloud UI names the file of a new entry, from its fields. It uses the same `{token}` syntax as `media.saveAs`, with top-level fields as tokens:

  ```ts
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema,
    cloud: { saveAs: "{firstName}-{lastName}" }, // jane-doe.json
  });
  ```

  Tokens must be required string, number, or boolean fields. An unknown or optional field, a `/` or `.`, or a pattern without a token is a type error, and `qino build` checks the same rules.

### Patch Changes

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Fixes `qino build` rejecting `sortableBy`, `media.fields`, and `saveAs` fields narrowed by an intersection, such as `z.unknown().and(z.string())`: intersections now narrow a field's types instead of adding them up.

## 0.11.0

### Minor Changes

- [#225](https://github.com/CharlyMartin/qino/pull/225) [`4cab8c8`](https://github.com/CharlyMartin/qino/commit/4cab8c85ca8770a00d9ff7a26f9056c2eb1abd18) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds three cloud UI options, written to `qino/_generated/config.json`:

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

## 0.10.0

### Minor Changes

- [#223](https://github.com/CharlyMartin/qino/pull/223) [`c2b4bc5`](https://github.com/CharlyMartin/qino/commit/c2b4bc566bab5de39ba0a90efd16fa283375c32b) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `cli.build.types` to `initQino`. Set it to `false` to make `qino build` skip writing `qino/_generated/types.d.ts`. Defaults to `true`.

  ```ts
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cli: { build: { types: false } },
  });
  ```

## 0.9.0

### Minor Changes

- [#218](https://github.com/CharlyMartin/qino/pull/218) [`83f0269`](https://github.com/CharlyMartin/qino/commit/83f0269845cbecf8172ca0c03a94a29a3712a1e0) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Moves `checkLocalAssetReferences` on `initQino` to `cli.check.localAssetReferences`, so CLI options are namespaced by command. This is a breaking change:

  ```diff
   initQino({
     contentFolder: "src/content",
     mediaFolder: "public",
  -  checkLocalAssetReferences: { exclude: ["/og/**"] },
  +  cli: {
  +    check: { localAssetReferences: { exclude: ["/og/**"] } },
  +  },
   });
  ```

## 0.8.0

### Minor Changes

- [#216](https://github.com/CharlyMartin/qino/pull/216) [`62bfc33`](https://github.com/CharlyMartin/qino/commit/62bfc33aab054d85840f443d6ffcf644932d0a92) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `cloud` option to `initQino`, `defineCollection`, `defineTree`, and `defineItem` to configure the Qino cloud UI: publish mode, review, accepted uploads, searchable and sortable fields, and where media lands. Values are written, resolved, into `qino/_generated/config.json`.

  ```ts
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: {
      publish: { mode: "open_pull_request", reviewBeforePublish: true },
      media: { accepted: [{ type: "image/*", maxSize: "5MB" }] },
    },
  });

  qino.defineCollection({
    // ...
    cloud: {
      searchableBy: ["title"],
      sortableBy: ["title"],
      media: { saveAs: "posts/{name}-{hash}.{ext}" },
    },
  });
  ```

  Removes `buildConfigFile`: setting `cloud` now writes `config.json`. This is a breaking change:

  ```diff
   initQino({
     contentFolder: "content",
     mediaFolder: "public",
  -  buildConfigFile: true,
  +  cloud: {
  +    publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
  +  },
   });
  ```

## 0.7.0

### Minor Changes

- [#199](https://github.com/CharlyMartin/qino/pull/199) [`c991a5f`](https://github.com/CharlyMartin/qino/commit/c991a5f0a25386bc8c5e7abe8c11a53cbd2672c2) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `buildConfigFile` option to `initQino` and flattens its config. This is a breaking change.

  #### Flat `initQino` config

  `media.folder` becomes `mediaFolder` and `media.checkReferences` becomes `checkLocalAssetReferences`, with the same values and defaults:

  ```diff
   initQino({
     contentFolder: "src/content",
  -  media: {
  -    folder: "public",
  -    checkReferences: { exclude: ["/og/**"] },
  -  },
  +  mediaFolder: "public",
  +  checkLocalAssetReferences: { exclude: ["/og/**"] },
   });
  ```

  #### `buildConfigFile`

  When enabled, `qino build` also writes `qino/_generated/config.json`, a committable description of the project: config, every collection, item, and tree with its body format (`markdown`, `mdx`, or `null` for JSON), its schema as JSON Schema (draft 2020-12), and its relations. `qino check` fails when the committed file is missing or out of date.

  ```ts
  export default initQino({
    contentFolder: "src/content",
    mediaFolder: "public",
    buildConfigFile: true,
  });
  ```

  Schemas are converted through Standard JSON Schema, which Zod 4.2+ implements. `qino build` fails when a schema can't be converted, when a transform renames or changes the value of a relation field or `titleField`, or when a relation targets a primitive that isn't exported from `qino/`.

## 0.6.0

### Minor Changes

- [#197](https://github.com/CharlyMartin/qino/pull/197) [`2a58658`](https://github.com/CharlyMartin/qino/commit/2a58658fd5ab64e38725415b18c9568e1c15e315) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Replaces `mediaFolder` with a `media` option on `initQino` and adds a media check to `qino check` and `qino build`. This is a breaking change:

  ```diff
    initQino({
      contentFolder: "content",
  -   mediaFolder: "public",
  +   media: { folder: "public" },
    });
  ```

  Every root-relative URL with a file extension in content must now exist in `media.folder`. The check scans Markdown images and links, `src`/`poster` attributes, and frontmatter or JSON values. Missing files are listed with their `file:line`. Exclude files served by routes, or turn the check off:

  ```ts
  media: {
    folder: "public",
    checkReferences: { exclude: ["/og/**", "/feed.xml"] }, // or `false`
  },
  ```

## 0.5.1

### Patch Changes

- [#178](https://github.com/CharlyMartin/qino/pull/178) [`01f4e5a`](https://github.com/CharlyMartin/qino/commit/01f4e5ab068ebbe043a9a5ef7a9d7e85f2aac8a0) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Shortens the package README and points `homepage` to the documentation at [www.qino.works](https://www.qino.works)

## 0.5.0

### Minor Changes

- [#175](https://github.com/CharlyMartin/qino/pull/175) [`5e345f6`](https://github.com/CharlyMartin/qino/commit/5e345f62a4ed0cb4dd95c6c70b52872bc89e2973) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Changes paths in `defineCollection`, `defineTree`, `defineItem`, and relation values to one convention: relative to `contentFolder`, with no leading `/`. A leading `/` is now a type error in definitions and a runtime error with a suggested fix. This is a breaking change:

  ```diff
  - defineCollection({ directory: "/posts", ... });
  - defineItem({ file: "/pages/home.md", ... });
  + defineCollection({ directory: "posts", ... });
  + defineItem({ file: "pages/home.md", ... });
  ```

  ```diff
  - author: "/authors/jane.json"
  + author: "authors/jane.json"
  ```

  A primitive at the content root uses `directory: ""` instead of `"/"`. Rerun `qino build` to regenerate `qino/_generated/types.d.ts`. `QinoSlugRegistry` keys are now `"posts"` instead of `"/posts"`.

  Relation values can also be root paths that go through `contentFolder`, like `src/content/authors/jane.json` or `apps/site/src/content/authors/jane.json`. Repos edited with Git-based CMSs such as Decap CMS, which store paths from the repository root, keep working.

- [#173](https://github.com/CharlyMartin/qino/pull/173) [`ef99311`](https://github.com/CharlyMartin/qino/commit/ef99311a4a301425a42d29887afac8c66ddeac0c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Changes `markdown` and `raw` on Markdown entries to be added after validation, like `_meta`. Schemas now validate frontmatter only, so they no longer need to declare either field, and strict objects work as-is. A file without frontmatter can use `z.object({})`. Both fields are still there in getters, views, and resolved relations.

  This is a breaking change. In `.md`, `.mdx`, and `.markdown` entries, `markdown` and `raw` are now reserved schema keys. Declaring them is a type error, and an old schema that still requires them fails validation with a hint naming them. Remove them from Markdown schemas, and move any schema transform of `markdown` into a view `augment`:

  ```diff
    qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({
        title: z.string(),
  -     markdown: z.string(),
  -     raw: z.string(),
      }),
    });
  ```

  JSON entries are unchanged: there, `markdown` and `raw` are still ordinary fields.

## 0.4.1

### Patch Changes

- [#170](https://github.com/CharlyMartin/qino/pull/170) [`f3df948`](https://github.com/CharlyMartin/qino/commit/f3df948a685d9db694e6efef78b83424060dcf0b) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Fixes `qino lint`, `qino check`, and `qino build` failing to resolve tsconfig path aliases in the instance, definitions, and their imports, including paths inherited through `extends`.

## 0.4.0

### Minor Changes

- [#163](https://github.com/CharlyMartin/qino/pull/163) [`a295736`](https://github.com/CharlyMartin/qino/commit/a295736f3f6de3907f47df60c1ca07ad7c123a16) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `raw` field to Markdown entries holding the untouched source file, frontmatter included. Declare it in the schema to keep it:

  ```ts
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
    raw: z.string(),
  });
  ```

  `raw` is now reserved on Markdown entries: it cannot appear in frontmatter or be added by `augment`. Strict schemas (`z.strictObject`) must declare it:

  ```diff
    z.strictObject({
      markdown: z.string(),
  +   raw: z.string(),
    })
  ```

## 0.3.0

### Minor Changes

- [#154](https://github.com/CharlyMartin/qino/pull/154) [`656cf63`](https://github.com/CharlyMartin/qino/commit/656cf631792fdbf9e4bfce4a94b81857929c0c47) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames collection and item getters so every primitive reads entries with `getEntry`. This is a breaking change:

  ```diff
  - await posts.getMany();
  - await posts.getOne("hello-world");
  - await home.getData();
  + await posts.getEntries();
  + await posts.getEntry("hello-world");
  + await home.getEntry();
  ```

## 0.2.0

### Minor Changes

- [#152](https://github.com/CharlyMartin/qino/pull/152) [`4c19eb4`](https://github.com/CharlyMartin/qino/commit/4c19eb40cb3a713e1dfa30f28ac8bcf352864a05) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames `createQino` to `initQino`. This is a breaking change: replace `createQino` imports and calls with `initQino`. CLI error messages now name `initQino()`.

## 0.1.0

### Minor Changes

- [#115](https://github.com/CharlyMartin/qino/pull/115) [`f886aae`](https://github.com/CharlyMartin/qino/commit/f886aaef7865e65ea9318df5ea21a557837005f1) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Initial public release. `@qino/cms/utils` exposes `markdown` and the `MarkdownStats` type only; `assertDirectory`, `assertFile`, `isDirectory`, `isFile`, and `removeLeadingSlash` are internal.
