# @qino/tooling

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
