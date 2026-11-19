/**
 * A page's Markdown URL on `origin`: its path with `.md` appended, after any
 * trailing `/`, or `/index.md` for `/`.
 */
export function toMarkdownUrl(path: string, origin: string) {
  const markdownPath =
    path == "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`;
  return new URL(markdownPath, origin).href;
}
