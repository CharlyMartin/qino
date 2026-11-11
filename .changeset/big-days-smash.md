---
"@qino/tooling": minor
---

Adds `@qino/tooling/relations`, to read relations as `qino build` does:

- `parsePath(path)` and `collectPathValues(fields, segments)`: the values at a relation or media path like `gallery[*].src`.
- `parseRelationValue(value, target, { contentFolder, owner })`: the slug a relation value points to, or the file of an item target, from the fields `config.json` gives the target. Accepts root paths through the content folder, like `src/content/authors/jane.json`.
- `toDirectoryPrefix(directory)`: the prefix a directory's content paths start with.
