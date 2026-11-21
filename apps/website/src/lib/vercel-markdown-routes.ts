// A range's parameters other than q, and RFC 9110's qvalue above 0.
const OTHER_PARAMS = String.raw`(?:\s*;(?!\s*[qQ]\s*=)[^;,]*)*`;
const QVALUE_ABOVE_0 = String.raw`(?:1(?:\.0{0,3})?|0\.(?!0{1,3}\s*(?:[;,]|$))\d{1,3})(?=\s*(?:[;,]|$))`;

// An `Accept` header whose first range is Markdown, in lowercase, with a
// well-formed q-value above 0 or none. Vercel matches it as a regex, which
// can't weigh q-values: where they reorder the ranges, as in
// `text/markdown;q=0.5, */*`, it disagrees with `negotiateMarkdown`.
const LISTS_MARKDOWN_FIRST = String.raw`^text/(?:x-)?markdown${OTHER_PARAMS}(?:\s*;\s*[qQ]\s*=\s*${QVALUE_ABOVE_0}${OTHER_PARAMS})?\s*(?:,.*)?$`;

// The pages with agent Markdown, and their Markdown URLs.
const pages = [
  {
    src: "^/$",
    markdownUrl: "/index.md",
    links: ['</llms.txt>; rel="describedby"'],
  },
  { src: String.raw`^/(docs|blog)/?$`, markdownUrl: "/$1.md" },
  {
    src: String.raw`^/(docs|blog)/([\w-]+(?:/[\w-]+)*)/?$`,
    markdownUrl: "/$1/$2.md",
  },
];

// Vercel serves prerendered pages before any route runs, so these negotiate
// Markdown for them. Nitro's route type lacks `has` and `check`, so it gets
// this constant rather than a literal.
export const vercelMarkdownRoutes = [
  ...pages.map(({ src, markdownUrl, links = [] }) => ({
    src,
    headers: {
      Vary: "Accept",
      Link: [
        `<${markdownUrl}>; rel="alternate"; type="text/markdown"`,
        ...links,
      ].join(", "),
    },
    continue: true,
  })),
  // `check` sends a Markdown URL that wasn't prerendered on to the server.
  ...pages.map(({ src, markdownUrl }) => ({
    src,
    has: [{ type: "header", key: "accept", value: LISTS_MARKDOWN_FIRST }],
    dest: markdownUrl,
    check: true,
  })),
];
