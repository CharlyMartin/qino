import { toOneLine } from "./to-one-line";

type FormatAgentFrontmatterParams = {
  /** The document's title, on one line. */
  title: string;
  /** Its description, left out when empty. */
  description?: string;
  /** The URL of the page it stands in for. */
  canonical: string;
};

// Characters JSON leaves raw that YAML parsers reject, such as DEL and the C1
// controls, or read as line breaks in YAML 1.1, plus the BOM.
const UNSAFE_IN_YAML = /[\u007f-\u009f\u2028\u2029\ufeff]/g;

/**
 * Agent Markdown's frontmatter block: `title`, `description` on one line when
 * there is one, and `canonical`. Each value is a double-quoted YAML string,
 * escaped as JSON, which YAML reads the same way.
 */
export function formatAgentFrontmatter({
  title,
  description = "",
  canonical,
}: FormatAgentFrontmatterParams) {
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
