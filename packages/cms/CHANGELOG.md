# @qino/cms

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
