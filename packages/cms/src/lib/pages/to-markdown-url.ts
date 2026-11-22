import { toPageUrl } from "./to-page-url";

/**
 * A page's Markdown URL on `origin`: its path with `.md` appended, after any
 * trailing `/`, or `/index.md` for `/`.
 */
export function toMarkdownUrl(path: string, origin: string) {
  const markdownPath =
    path == "/" ? "/index.md" : `${path.replace(/\/$/, "")}.md`;
  return toPageUrl(markdownPath, origin);
}
