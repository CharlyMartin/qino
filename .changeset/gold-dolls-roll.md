---
"@qino/tooling": minor
---

Adds `@qino/tooling/media`, to find the media a content file uses as `qino check` does:

- `extractMediaLinks(source, extension)`: the local media URLs of a Markdown, MDX or JSON file, normalized, with their line. Reads frontmatter and JSON strings, and the body's images, links, and `src` or `poster` attributes, never code.
- `extractMediaCandidates(source, extension)`: every URL as written, with `image` set on images.
- `isLocalMediaUrl(url)` and `normalizeMediaUrl(url)`.
