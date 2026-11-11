# @qino/tooling

Schemas and helpers for tools built on [Qino](https://www.qino.works) projects, like the Qino cloud UI.

```sh
pnpm add @qino/tooling
```

- `parseConfigFile(json)`: validates a generated `qino/_generated/config.json`, any supported `version`
- `configFileSchema`, `type ConfigFile`: the zod schema and type of that file
- `getEntrySchema(primitive)`: a zod schema for a primitive's entries, from its JSON Schema
- `parseFrontmatter(source)`, from `@qino/tooling/frontmatter`: splits a Markdown or MDX file into its YAML frontmatter (`data`) and its `body`, as `qino build` reads it. Needs no zod

## License

MIT
