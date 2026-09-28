# @qino/cms

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
