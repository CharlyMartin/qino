# Assets

**Status:** v1-proposed
**Version:** v1

## Intent

Image and media handling needs three things from the developer's perspective:

1. Declare whether an asset is local (under `mediaFolder`) or remote (a URL).
2. Constrain the file extension(s).
3. Optionally constrain the filename pattern, so editors can't dump `IMG_2391_final_v2.png` into the repo.

The cloud UI uses the same declaration to filter file pickers.

## API (proposed)

### Local asset, single extension

```ts
import { defineCollection } from "@qino/cms";
import z from "zod";

const PostSchema = z.object({
  title: z.string(),
  image: z.qino().asset(".jpg").local(),
});
```

### Remote asset

```ts
image: z.qino().asset(".jpg").remote();
```

### Filename pattern

```ts
image: z.qino().asset(".jpg").local().name("^post-\\d{4}-[a-z0-9-]+$");
```

Pattern is a regex (string form so it survives JSON serialisation in the lock file). Filename is matched without the extension.

### Multiple extensions

```ts
image: z.qino().asset([".jpg", ".png", ".webp"]).local();
```

## Behaviour

- **Local validation at build time.** `qino build` checks every `local()` asset path resolves to a file under `mediaFolder` with the declared extension and matching filename pattern. Misses fail the build.
- **Remote validation at build time.** Format check only (must look like a URL with the declared extension). No network fetch.
- **No transformation.** Qino doesn't resize or optimise images. That's the consumer's pipeline.
- The asset declaration is reflected in the lock file so the cloud UI can render the right picker.

## Lock-file representation

```json
"assets": [
  {
    "field": "image",
    "extension": [".jpg"],
    "scope": "local",
    "namePattern": "^post-\\d{4}-[a-z0-9-]+$"
  }
]
```

(Stored on the collection entry alongside `relations[]`.)

## Open questions

- Should `mediaFolder` be partitionable per-collection (e.g. `public/posts/` vs `public/authors/`)?
- Path of stored value: should `local()` paths be relative to `mediaFolder` or absolute-from-public-root (e.g. leading `/`)?
- Do remote assets need a domain allowlist?

## Acceptance criteria

Done when:

- An entry declaring `image: z.qino().asset(".jpg").local()` fails `qino build` if the file isn't under `mediaFolder`.
- A bad filename pattern surfaces a clear validation error pointing at the entry.
- The lock file records the asset declaration so a future cloud UI can act on it.
