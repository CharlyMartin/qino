# Qino

The modern headless Markdown CMS.

[![npm version](https://img.shields.io/npm/v/@qino/cms)](https://www.npmjs.com/package/@qino/cms)
[![CI](https://github.com/CharlyMartin/qino/actions/workflows/ci.yml/badge.svg)](https://github.com/CharlyMartin/qino/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/@qino/cms)](./LICENSE)

Qino turns a folder of Markdown, MDX, and JSON files into typed, validated content you can query from any JavaScript app. Your repo is the source of truth. No database, no hosted backend.

- **Flat-file**: content lives on disk and moves with your code through branches, PRs, and tags.
- **Typed**: define collections, items, and trees with a schema (Zod or any Standard Schema validator) and get fully inferred types from the getters.
- **Relations and views**: link entries across collections and expose named shapes of the same content, with resolution, filtering, sorting, and derived fields.
- **CLI**: lint definitions, validate every content file, and generate types as part of your build.
- **Framework-agnostic**: works anywhere Node runs. A Next.js reference app lives in [`examples/next-js`](./examples/next-js).

## Documentation

<!-- TODO: replace with docs + website URLs once live -->

- Docs: _coming soon_
- Website: _coming soon_

Until then, [`examples/next-js`](./examples/next-js) is the canonical reference, and [`packages/cms/README.md`](./packages/cms/README.md) covers the API in more depth.

## Installation

Requires Node.js 22 or newer.

```sh
pnpm add @qino/cms zod
# npm install @qino/cms zod
# yarn add @qino/cms zod
```

Zod is optional; any [Standard Schema](https://standardschema.dev) validator works.

## Quick start

Create a Qino instance pointing at your content and media folders:

```ts
// qino/index.ts
import { createQino } from "@qino/cms";

export default createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});
```

Define a collection and read from it:

```ts
// qino/collections/posts.ts
import { z } from "zod";
import qino from "../";

export const postCollection = qino.defineCollection({
  directory: "/posts",
  extension: ".md",
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
  }),
});

const posts = await postCollection.getMany();
const post = await postCollection.getOne("hello-world");
```

Each entry in `src/content/posts/*.md` is validated against the schema. The Markdown body is passed as `markdown`, and Qino adds `_meta` (slug, path) to every entry.

Run `qino build` before your app builds to validate content and generate types:

```json
{
  "scripts": {
    "prebuild": "qino build",
    "build": "next build"
  }
}
```

## CLI

| Command      | Description                                             |
| ------------ | ------------------------------------------------------- |
| `qino lint`  | Validate config, paths, and relations (no content read) |
| `qino check` | Validate every content file against its schema          |
| `qino build` | Run lint + check, then generate types                   |

## Packages

| Package                                  | Description                      |
| ---------------------------------------- | -------------------------------- |
| [`@qino/cms`](./packages/cms)            | Core library and `qino` CLI      |
| [`examples/next-js`](./examples/next-js) | Reference Next.js app using Qino |

## License

[MIT](./LICENSE)
