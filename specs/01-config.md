# Config

**Status:** stable
**Version:** v1

## Intent

`qino/index.ts` is where developers declare project-wide settings (content and media
folders) and create the `createCollection` / `createSingleton` / `createTree`
factories that the rest of the project uses. These values are captured in-memory by
the returned Qino instance and read by getters at runtime — there is no JSON
manifest on disk (see `11-lock-file.md` for the deferred cloud-UI artifact).

## API

```ts
// qino/index.ts
import { createQino } from "qino";

export const { createCollection, createSingleton, createTree } = createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});
```

`createQino` validates the options, mints an internal instance id, and returns
factory functions bound to that instance. Every primitive created from these
factories carries the same instance id on its `QinoMeta` — relations across
instances throw at build time and at runtime.

Per-primitive files import from this entry:

```ts
// qino/collections/posts.ts
import { createCollection } from "../";

export const postCollection = createCollection({
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
});
```

## Schema

```ts
{
  contentFolder: string,  // path relative to repo root
  mediaFolder:   string,  // path relative to repo root
}
```

Source of truth: `packages/qino/src/runtime/qino/qino-options.ts`.

## Behaviour

- `qino/index.ts` is imported transitively by every collection/singleton/tree file
  (through the `import { createCollection } from "../"` chain). It is also loaded by
  `qino build` indirectly — the CLI globs `qino/collections/*`, `qino/singletons/*`,
  `qino/trees/*` and jiti-imports each file, which evaluates `createQino` exactly
  once.
- The CLI uses [jiti](https://github.com/unjs/jiti) to import TS files without a
  build step.
- Both folder paths must exist and be directories — `qino build` errors out
  otherwise.
- Paths in collection / singleton / tree definitions are resolved relative to
  `contentFolder`. Asset paths resolve relative to `mediaFolder`.

## Open questions

- Add `i18n: boolean` (deferred to V2 — see `12-i18n.md`).
- Add `ui: true` opt-in to re-enable lock-file emission for the cloud UI (see
  `11-lock-file.md` and `13-cloud-ui.md`).

## Acceptance criteria

Done when:

- A consumer can run `qino build` and see schemas + paths + relations validated with
  no JSON artifact written.
- Missing or invalid `qino/index.ts` produces a clear error at build time.
- Getters at runtime read paths only from the in-memory `QinoMeta`, never from a
  generated file.
