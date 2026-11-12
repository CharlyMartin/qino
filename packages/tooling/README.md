# @qino/tooling

Schemas and helpers for tools built on [Qino](https://www.qino.works) projects, like the Qino cloud UI.

```sh
pnpm add @qino/tooling
```

- `parseConfigFile(json)`: validates a generated `qino/_generated/config.json`, any supported `version`
- `configFileSchema`, `type ConfigFile`: the zod schema and type of that file
- `getEntrySchema(primitive)`: a zod schema for a primitive's entries, from its JSON Schema
- `parseFrontmatter(source)`, from `@qino/tooling/frontmatter`: splits a Markdown or MDX file into its YAML frontmatter (`data`) and its `body`, as `qino build` reads it. Needs no zod
- From `@qino/tooling/relations`, to read relations as `qino build` does. Needs no zod:
  - `parsePath(path)` and `collectPathValues(fields, segments)`: the values at a relation or media path like `gallery[*].src`
  - `parseRelationValue(value, target, { contentFolder, owner })`: the slug a relation value points to, or the file of an item target. Accepts root paths through the content folder, like `src/content/authors/jane.json`; pass `contentFolder` from the repository root
  - `toDirectoryPrefix(directory)`: the prefix a directory's content paths start with: `authors` gives `authors/`, the content root gives `""`
- From `@qino/tooling/media`, to find the media a content file uses as `qino check` does. Needs no zod:
  - `extractMediaLinks(source, extension)`: the local media URLs of a Markdown, MDX or JSON file, normalized, with their line: frontmatter or JSON strings, and the body's images, links, and `src` or `poster` attributes. Code is never read
  - `extractMediaCandidates(source, extension)`: every URL as written, local or not, with `image` set on images
  - `isLocalMediaUrl(url)` and `normalizeMediaUrl(url)`: a URL in `mediaFolder` starts with one `/`; normalizing drops the query and hash and decodes each segment

## License

MIT
