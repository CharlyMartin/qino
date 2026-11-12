# @qino/tooling

## 0.8.0

### Minor Changes

- [#316](https://github.com/CharlyMartin/qino/pull/316) [`80e2ad1`](https://github.com/CharlyMartin/qino/commit/80e2ad157a8302a0c9d18fc4bf69df374f203412) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `@qino/tooling/relations`, to read relations as `qino build` does:

  - `parsePath(path)` and `collectPathValues(fields, segments)`: the values at a relation or media path like `gallery[*].src`.
  - `parseRelationValue(value, target, { contentFolder, owner })`: the slug a relation value points to, or the file of an item target, from the fields `config.json` gives the target. Accepts root paths through the content folder, like `src/content/authors/jane.json`.
  - `toDirectoryPrefix(directory)`: the prefix a directory's content paths start with.

- [#317](https://github.com/CharlyMartin/qino/pull/317) [`cc371a2`](https://github.com/CharlyMartin/qino/commit/cc371a2b729f2ee7c77d4ca97e6ab538ffa68200) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `@qino/tooling/media`, to find the media a content file uses as `qino check` does:

  - `extractMediaLinks(source, extension)`: the local media URLs of a Markdown, MDX or JSON file, normalized, with their line. Reads frontmatter and JSON strings, and the body's images, links, and `src` or `poster` attributes, never code.
  - `extractMediaCandidates(source, extension)`: every URL as written, with `image` set on images.
  - `isLocalMediaUrl(url)` and `normalizeMediaUrl(url)`.

- [#318](https://github.com/CharlyMartin/qino/pull/318) [`4e31fdc`](https://github.com/CharlyMartin/qino/commit/4e31fdcf914dd57fdd270a90637ab80f4c6e309b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `"customFormat": true` to relations and media rules in `config.json` when they have a `parse` callback, which can't be written to JSON. The cloud UI shows those fields read-only, since it can't tell which values the callback reads. `configFileSchema` and `ConfigFile` accept the new field.

  Projects with a `parse` callback get a new `config.json`: run `qino build` after upgrading, or `qino check` reports it out of date.

## 0.7.0

### Minor Changes

- [#314](https://github.com/CharlyMartin/qino/pull/314) [`c645f24`](https://github.com/CharlyMartin/qino/commit/c645f24d92ec060727b5963691f218f0140cf26f) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `parseFrontmatter` at `@qino/tooling/frontmatter`. It splits a Markdown or MDX file into its YAML frontmatter (`data`) and its `body`, exactly as `qino build` reads it, so tools like the Qino cloud UI read content files the same way. It needs no zod and uses no Node APIs:

  ```ts
  import { parseFrontmatter } from "@qino/tooling/frontmatter";

  const { data, body } = parseFrontmatter("---\ntitle: Hello\n---\n# Hello");
  // data: { title: "Hello" }, body: "# Hello"
  ```

## 0.6.0

### Minor Changes

- [#259](https://github.com/CharlyMartin/qino/pull/259) [`1179ac6`](https://github.com/CharlyMartin/qino/commit/1179ac658f0998399ca924a297bca1e510acc513) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames `cloud.saveAs` to `cloud.saveEntryAs`, matching `displayEntryAs` and `media.saveFileAs`. `config.json` writes `saveEntryAs` too:

  ```diff
   cloud: {
     displayEntryAs: "{title}",
  -  saveAs: "{title}",
  +  saveEntryAs: "{title}",
   },
  ```

## 0.5.0

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

## 0.4.0

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

## 0.3.0

### Minor Changes

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds the optional `saveAs` to collection and tree `cloud` in the config file schemas.

## 0.2.0

### Minor Changes

- [#225](https://github.com/CharlyMartin/qino/pull/225) [`4cab8c8`](https://github.com/CharlyMartin/qino/commit/4cab8c85ca8770a00d9ff7a26f9056c2eb1abd18) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `hiddenFields` and `media.fields` to the config file schemas, and changes `publish.reviewBeforePublish` from a boolean to `false` or `{ bypassIfAdmin: boolean }`. This is a breaking change: files written by older `qino build` versions no longer parse. Run `qino build` with the matching `@qino/cms` to regenerate them.

## 0.1.0

### Minor Changes

- [#220](https://github.com/CharlyMartin/qino/pull/220) [`53b91dc`](https://github.com/CharlyMartin/qino/commit/53b91dcb2ee6d9c817850ff90e1dd14a39f7b1b3) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `@qino/tooling`, schemas and helpers for tools built on Qino projects, like the Qino cloud UI. Requires `zod` 4 as a peer dependency.

  - `parseConfigFile` validates a generated `qino/_generated/config.json`, dispatching on its `version`. `configFileSchema` and `type ConfigFile` are its zod schema and type.
  - `getEntrySchema` builds a zod schema validating a primitive's entries, from the JSON Schema in `config.json`:

  ```ts
  const { collections } = parseConfigFile(JSON.parse(file));
  const posts = collections["posts"];
  if (posts) getEntrySchema(posts).safeParse(frontmatter);
  ```
