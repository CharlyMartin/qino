/** A page's Markdown URL: its path with `.md` appended, or `/index.md` for `/`, on `origin`. */
export function toMarkdownUrl(path: string, origin: string) {
  return new URL(path == "/" ? "/index.md" : `${path}.md`, origin).href;
}
