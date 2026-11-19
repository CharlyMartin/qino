type RangeMatch = {
  q: number;
  position: number;
};

type HtmlMatch = RangeMatch & {
  /** 1 for a full wildcard, 2 for `text/*`, 3 for `text/html`. */
  specificity: number;
};

const UNMATCHED: HtmlMatch = { q: 0, position: Infinity, specificity: 0 };

// Ranges that match HTML, most specific last: the most specific one sets its q.
const HTML_RANGES = ["*/*", "text/*", "text/html"];
// Only named ranges count for Markdown: a wildcard alone means HTML.
const MARKDOWN_TYPES = ["text/markdown", "text/x-markdown"];

/**
 * Whether an `Accept` header prefers Markdown to HTML: `text/markdown` (or
 * `text/x-markdown`) has the higher q-value, or the same one and comes first,
 * so `text/markdown, text/html` gets Markdown. Wildcards count toward HTML,
 * the default: so does a missing header, `text/plain`, or `q=0` on Markdown.
 * q-values are capped at 1, and a range whose q-value can't be read is
 * ignored.
 */
export function prefersMarkdown(accept: string | null) {
  let markdown: RangeMatch = UNMATCHED;
  let html = UNMATCHED;

  for (const [position, range] of (accept ?? "").split(",").entries()) {
    const [type = "", ...params] = range
      .split(";")
      .map((part) => part.trim().toLowerCase());
    const qParam = params
      .map((param) => param.split("=").map((part) => part.trim()))
      .find(([name]) => name == "q");
    const q = qParam ? Math.min(Math.max(Number(qParam[1]), 0), 1) : 1;
    if (Number.isNaN(q)) continue;

    const specificity = HTML_RANGES.indexOf(type) + 1;
    if (MARKDOWN_TYPES.includes(type) && q > markdown.q) {
      markdown = { q, position };
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
