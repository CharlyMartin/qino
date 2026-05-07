# Config

**Status:** stable
**Version:** v1

## Intent

`qino/config.ts` is where developers declare project-wide settings: where content and media files live in the consumer app. These values are written into `qino-lock.json` by the CLI and read back by getters at runtime.

## API

```ts
// qino/config.ts
import { createConfig } from "qino";

export default createConfig({
  contentFolder: "src/content",
  mediaFolder: "public",
});
```

`createConfig` is a typed passthrough — returns the config untouched. Its only job is to type-check the input and act as the export the CLI loads.

## Schema

```ts
{
  contentFolder: string,  // path relative to repo root
  mediaFolder:   string,  // path relative to repo root
}
```

Source of truth: `packages/qino/src/runtime/create-config.ts`.

## Behaviour

- `qino/config.ts` is **never** imported by the consumer app. It is loaded only by `qino build`.
- The CLI uses [jiti](https://github.com/unjs/jiti) to import the TS file without a build step.
- Both folder paths must exist and be directories — `qino build` errors out otherwise.
- Paths in collection definitions are resolved relative to `contentFolder`. Asset paths resolve relative to `mediaFolder`.

## Open questions

- Add `i18n: boolean` (deferred to V2 — see `12-i18n.md`).

## Acceptance criteria

Done when:

- A consumer can run `qino build` and see `qino-lock.json` written with the config block.
- Missing or invalid `qino/config.ts` produces a clear error at build time.
- Getters at runtime read paths only via the lock file, never by importing `config.ts`.
