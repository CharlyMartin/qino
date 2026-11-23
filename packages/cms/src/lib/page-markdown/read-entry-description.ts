import { absolutizeLinks } from "./absolutize-links";

/**
 * An entry's `description`, trimmed and with LF line endings, its site-relative
 * links made absolute on `origin`, or `""`.
 */
export function readEntryDescription(
  entry: Record<string, unknown>,
  origin: string,
) {
  if (typeof entry.description != "string") return "";

  // YAML block scalars (`|`, `>`) end a description with a newline.
  const description = entry.description.replace(/\r\n?/g, "\n").trim();
  // Frontmatter is plain Markdown, never MDX.
  return absolutizeLinks(description, { origin, mdx: false });
}
