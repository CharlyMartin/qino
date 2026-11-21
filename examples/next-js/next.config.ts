import type { NextConfig } from "next";

// A range's parameters other than q, and RFC 9110's qvalue above 0.
const OTHER_PARAMS = String.raw`(?:\s*;(?!\s*[qQ]\s*=)[^;,]*)*`;
const QVALUE_ABOVE_0 = String.raw`(?:1(?:\.0{0,3})?|0\.(?!0{1,3}\s*(?:[;,]|$))\d{1,3})(?=\s*(?:[;,]|$))`;

// An `Accept` header whose first range is Markdown, in lowercase, with a
// well-formed q-value above 0 or none. A regex can't weigh q-values: where they
// reorder the ranges, as in `text/markdown;q=0.5, */*`, it disagrees with
// `negotiateMarkdown`.
const LISTS_MARKDOWN_FIRST = String.raw`^text/(?:x-)?markdown${OTHER_PARAMS}(?:\s*;\s*[qQ]\s*=\s*${QVALUE_ABOVE_0}${OTHER_PARAMS})?\s*(?:,.*)?$`;
const markdownFirstAccept = [
  { type: "header" as const, key: "accept", value: LISTS_MARKDOWN_FIRST },
];

// Entry pages. `/posts/tags` and `/posts/authors` are pages of their own, and
// a slug never holds a `.`, which keeps Markdown URLs out.
const POST_PAGE = "/posts/:slug((?!tags$|authors$)[^/.]+)";
const DOC_PAGE = "/docs/:slug([^.]+)";

const nextConfig: NextConfig = {
  transpilePackages: ["@qino/cms"],
  // The route handlers under `/md` render on request, and read content then.
  outputFileTracingIncludes: { "/md/**": ["./src/content/**/*"] },
  // `beforeFiles` runs before prerendered pages, which would answer first.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/posts.md", destination: "/md/posts" },
        { source: "/posts/:slug.md", destination: "/md/posts/:slug" },
        { source: "/docs.md", destination: "/md/docs" },
        { source: "/docs/:slug+.md", destination: "/md/docs/:slug+" },
        {
          source: "/posts",
          has: markdownFirstAccept,
          destination: "/md/posts",
        },
        {
          source: POST_PAGE,
          has: markdownFirstAccept,
          destination: "/md/posts/:slug",
        },
        { source: "/docs", has: markdownFirstAccept, destination: "/md/docs" },
        {
          source: DOC_PAGE,
          has: markdownFirstAccept,
          destination: "/md/docs/:slug",
        },
      ],
    };
  },
  // Next sets an App Router page's `Vary` itself, so only `Link` is added.
  async headers() {
    return [
      { source: "/posts", markdownUrl: "/posts.md" },
      { source: POST_PAGE, markdownUrl: "/posts/:slug.md" },
      { source: "/docs", markdownUrl: "/docs.md" },
      { source: DOC_PAGE, markdownUrl: "/docs/:slug.md" },
    ].map(({ source, markdownUrl }) => ({
      source,
      headers: [
        {
          key: "Link",
          value: `<${markdownUrl}>; rel="alternate"; type="text/markdown"`,
        },
      ],
    }));
  },
};

export default nextConfig;
