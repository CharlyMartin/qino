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
// RFC 9110's qvalue: 0 to 1, with up to three decimals.
const QVALUE = /^(0(\.\d{0,3})?|1(\.0{0,3})?)$/;

/**
 * Whether an `Accept` header prefers Markdown to HTML: `text/markdown` (or
 * `text/x-markdown`) has the higher q-value, or the same one and either comes
 * before `text/html` or ties only with a wildcard, so `text/markdown,
 * text/html` gets Markdown. Wildcards count toward HTML, the default: so does
 * a missing header, `text/plain`, or `q=0` on Markdown. A range whose q-value
 * doesn't follow RFC 9110's grammar is ignored.
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
    const qValue = qParam ? (qParam[1] ?? "") : "1";
    if (!QVALUE.test(qValue)) continue;

    const q = Number(qValue);

    const specificity = HTML_RANGES.indexOf(type) + 1;
    if (MARKDOWN_TYPES.includes(type) && q > markdown.q) {
      markdown = { q, position };
    }
    if (specificity > html.specificity) html = { q, position, specificity };
  }

  const isHtmlNamed = html.specificity == HTML_RANGES.length;
  return (
    markdown.q > html.q ||
    (markdown.q > 0 &&
      markdown.q == html.q &&
      (!isHtmlNamed || markdown.position < html.position))
  );
}
