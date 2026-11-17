type MediaRange = {
  type: string;
  subtype: string;
  q: number;
  position: number;
};

type Match = {
  q: number;
  specificity: number;
  position: number;
};

const noMatch: Match = { q: 0, specificity: -1, position: Infinity };

// Ranks text/markdown against text/html as https://acceptmarkdown.com does: by q,
// then specificity, then header order. Ties, `*/*` and a missing header stay HTML.
export function prefersMarkdown(accept: string | null) {
  if (!accept) return false;

  const ranges = accept.split(",").flatMap<MediaRange>((part, position) => {
    const [mediaType = "", ...params] = part.split(";");
    const [type, subtype] = mediaType.trim().toLowerCase().split("/");
    if (!type || !subtype) return [];

    const qParam = params.find((param) => /^\s*q\s*=/i.test(param));
    const q = qParam ? Number(qParam.split("=")[1]) : 1;
    if (Number.isNaN(q)) return [];

    return [{ type, subtype, q, position }];
  });

  // The most specific matching range sets the q value (RFC 9110, section 12.5.1).
  const match = (subtype: string) =>
    ranges.reduce((best, range) => {
      const specificity =
        range.type == "*" && range.subtype == "*"
          ? 0
          : range.type != "text"
            ? -1
            : range.subtype == "*"
              ? 1
              : range.subtype == subtype
                ? 2
                : -1;
      return specificity > best.specificity
        ? { q: range.q, specificity, position: range.position }
        : best;
    }, noMatch);

  const markdown = match("markdown");
  const html = match("html");
  if (markdown.q <= 0) return false;
  if (markdown.q != html.q) return markdown.q > html.q;
  if (markdown.specificity != html.specificity) {
    return markdown.specificity > html.specificity;
  }
  return markdown.position < html.position;
}
