/**
 * A page's Markdown URL on `origin`: its path with `.md` appended, after any
 * trailing `/`, or `/index.md` for `/`. The path is joined to the origin
 * before parsing, so no path, such as `//host`, can point it at another host.
 */
export function toMarkdownUrl(path: string, origin: string) {
  const markdownPath =
    path == "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`;
  return new URL(`${origin}${markdownPath}`).href;
}
