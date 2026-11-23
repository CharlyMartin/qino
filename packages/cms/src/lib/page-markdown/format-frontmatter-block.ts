import { toOneLine } from "./to-one-line";

type FormatFrontmatterBlockParams = {
  /** The document's title, on one line. */
  title: string;
  /** Its description, left out when empty. */
  description?: string;
  /** The URL of the page it stands in for. */
  canonical: string;
};

// Characters JSON leaves raw that YAML parsers such as PyYAML reject, DEL,
// the C1 controls, U+FFFE and U+FFFF, or read as a line break, U+0085.
const UNSAFE_IN_YAML = /[\u007f-\u009f\ufffe\uffff]/g;

/**
 * Page Markdown's frontmatter block: `title`, `description` on one line when
 * there is one, and `canonical`. Each value is a double-quoted YAML string,
 * escaped as JSON, which YAML reads the same way.
 */
export function formatFrontmatterBlock({
  title,
  description = "",
  canonical,
}: FormatFrontmatterBlockParams) {
  const fields = {
    title,
    ...(description && { description: toOneLine(description) }),
    canonical,
  };
  const lines = Object.entries(fields).map(([key, value]) => {
    const quoted = JSON.stringify(value).replace(
      UNSAFE_IN_YAML,
      (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
    );
    return `${key}: ${quoted}`;
  });
  return ["---", ...lines, "---"].join("\n");
}
