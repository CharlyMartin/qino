import { expect, test } from "vitest";

import { vercelMarkdownRoutes } from "./vercel-markdown-routes";

type Routed = {
  path: string;
  headers: Record<string, string>;
};

// Runs the routes the way Vercel does before it checks the filesystem: each
// route whose `src` matches adds its headers, and the first rewrite whose
// `has` also matches sets the path to look up. Both regexes match unanchored
// here, so the routes must anchor them.
function route(path: string, accept?: string) {
  const routed: Routed = { path, headers: {} };
  for (const { src, ...rest } of vercelMarkdownRoutes) {
    const match = new RegExp(src).exec(path);
    if (!match) continue;
    const fill = (value: string) =>
      value.replace(/\$(\d)/g, (_, group) => match[Number(group)] ?? "");

    if ("headers" in rest) {
      for (const [name, value] of Object.entries(rest.headers)) {
        routed.headers[name] = fill(value);
      }
    }
    if ("dest" in rest) {
      const wantsMarkdown = rest.has.every(
        ({ value }) => accept != undefined && new RegExp(value).test(accept),
      );
      if (wantsMarkdown) return { ...routed, path: fill(rest.dest) };
    }
  }
  return routed;
}

test.each([
  ["/", "/index.md"],
  ["/docs", "/docs.md"],
  ["/docs/", "/docs.md"],
  ["/blog", "/blog.md"],
  ["/docs/guide", "/docs/guide.md"],
  ["/docs/guide/cli", "/docs/guide/cli.md"],
  ["/docs/guide/cli/", "/docs/guide/cli.md"],
  ["/blog/why-another-cms", "/blog/why-another-cms.md"],
])("a Markdown request for %s gets %s", (path, markdownUrl) => {
  expect(route(path, "text/markdown").path).toBe(markdownUrl);
});

test.each([
  "/docs/guide/cli.md",
  "/docs.md",
  "/index.md",
  "/llms.txt",
  "/cloud",
  "/docsearch",
  "/assets/main.js",
  "/__tsr/staticServerFnCache/docs.json",
])("a Markdown request for %s keeps its path", (path) => {
  expect(route(path, "text/markdown").path).toBe(path);
});

test.each([
  "text/markdown",
  "text/x-markdown",
  "text/markdown, text/html, */*",
  "text/markdown;q=0.9, text/html;q=0.8",
  "text/markdown; q=0.5",
  "text/markdown;q=0.05",
])("Accept %j gets Markdown", (accept) => {
  expect(route("/docs/guide/cli", accept).path).toBe("/docs/guide/cli.md");
});

// Vercel can't weigh q-values, so only Markdown listed first counts.
test.each([
  undefined,
  "text/html",
  "*/*",
  "text/html, text/markdown",
  "text/html;q=0.5, text/markdown",
  "text/plain",
  "text/markdown;q=0",
  "text/markdown; q=0.000, text/html",
  "text/markdownish",
])("Accept %j gets HTML", (accept) => {
  expect(route("/docs/guide/cli", accept).path).toBe("/docs/guide/cli");
});

test("a page varies by Accept and links to its Markdown URL", () => {
  expect(route("/docs/guide/cli").headers).toEqual({
    Vary: "Accept",
    Link: '</docs/guide/cli.md>; rel="alternate"; type="text/markdown"',
  });
  expect(route("/blog", "text/markdown").headers).toEqual({
    Vary: "Accept",
    Link: '</blog.md>; rel="alternate"; type="text/markdown"',
  });
});

test("the homepage also links to llms.txt", () => {
  expect(route("/").headers).toEqual({
    Vary: "Accept",
    Link: '</index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"',
  });
});

test("other paths get no headers", () => {
  expect(route("/cloud").headers).toEqual({});
  expect(route("/docs/guide/cli.md").headers).toEqual({});
});
