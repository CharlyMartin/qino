# qino

The modern headless Markdown CMS.

Qino turns a folder of Markdown, MDX, and JSON files into typed, validated content you can query from any JavaScript app. Your repo is the source of truth: no database, no hosted backend.

- **Flat-file**: content lives on disk and moves with your code through branches, PRs, and tags.
- **Typed**: define collections, items, and trees with a schema (Zod or any Standard Schema validator) and get fully inferred types.
- **Relations and views**: link entries across collections and expose named shapes of the same content.
- **CLI**: lint definitions, validate content, and generate types as part of your build.
- **Framework-agnostic**: works anywhere Node.js 22+ runs.

```sh
pnpm add @qino/cms
```

Documentation: [qino.works/docs/guide](https://www.qino.works/docs/guide)

## License

MIT
