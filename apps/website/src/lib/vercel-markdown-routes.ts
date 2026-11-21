// An `Accept` header whose first range is Markdown, with a q-value above 0.
// Vercel matches it as a regex, which can't weigh q-values, so
// `text/html;q=0.5, text/markdown` gets HTML where `negotiateMarkdown` would
// answer Markdown.
const LISTS_MARKDOWN_FIRST = String.raw`^text/(?:x-)?markdown(?!\s*;\s*q\s*=\s*0(?:\.0{0,3})?\s*(?:,|$))(?:\s*[,;].*)?$`;

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
