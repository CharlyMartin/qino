# @qino/cms

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
