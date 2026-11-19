type Preference = {
  q: number;
  position: number;
  specificity: number;
};

const NONE: Preference = { q: 0, position: Infinity, specificity: 0 };

// Ranges that match HTML, most specific last: the most specific one sets its q.
const HTML_RANGES = ["*/*", "text/*", "text/html"];
// Only named ranges count for Markdown: a wildcard alone means HTML.
const MARKDOWN_TYPES = ["text/markdown", "text/x-markdown"];

/**
 * Whether an `Accept` header prefers Markdown to HTML: `text/markdown` (or
 * `text/x-markdown`) has the higher q-value, or the same one and comes first,
 * so `text/markdown, text/html` gets Markdown. Wildcards count toward HTML,
 * the default: so does a missing header, `text/plain`, or `q=0` on Markdown.
 */
export function prefersMarkdown(accept: string | null) {
  let markdown = NONE;
  let html = NONE;

  for (const [position, range] of (accept ?? "").split(",").entries()) {
    const [type = "", ...params] = range
      .split(";")
      .map((part) => part.trim().toLowerCase());
    const qParam = params.find((param) => param.startsWith("q="));
    const q = qParam ? Number(qParam.slice(2)) : 1;
    const specificity = HTML_RANGES.indexOf(type) + 1;

    if (MARKDOWN_TYPES.includes(type) && q > markdown.q) {
      markdown = { q, position, specificity: 1 };
    }
    if (specificity > html.specificity) html = { q, position, specificity };
  }

  return (
    markdown.q > html.q ||
    (markdown.q > 0 &&
      markdown.q == html.q &&
      markdown.position < html.position)
  );
}
