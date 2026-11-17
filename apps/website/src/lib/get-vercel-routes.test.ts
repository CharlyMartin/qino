import { expect, test } from "vitest";

import { getVercelRoutes } from "./get-vercel-routes";

const [varyRoute, markdownRoute] = getVercelRoutes();

test.each([
  "/",
  "/docs",
  "/docs/",
  "/docs/concepts",
  "/docs/guide/cli",
  "/docs/guide/cli/",
])("routes Markdown requests for the page %s to the server", (path) => {
  expect(new RegExp(markdownRoute?.src ?? "").test(path)).toBe(true);
  expect(new RegExp(varyRoute?.src ?? "").test(path)).toBe(true);
});

test.each([
  "/docs/guide.md",
  "/llms.txt",
  "/assets/app.css",
  "/__tsr/staticServerFnCache/abc.json",
  "/blog/hello-qino",
  "/documentation",
  "//",
])("leaves %s to the file system", (path) => {
  expect(new RegExp(markdownRoute?.src ?? "").test(path)).toBe(false);
});

test("only matches GET and HEAD requests that accept Markdown", () => {
  expect(markdownRoute).toMatchObject({
    methods: ["GET", "HEAD"],
    dest: "/__server",
  });
  const value = new RegExp(`^${markdownRoute?.has?.[0]?.value}$`);
  expect(value.test("text/markdown, text/html, */*")).toBe(true);
  expect(value.test("Text/Markdown")).toBe(true);
  expect(value.test("text/html,*/*;q=0.8")).toBe(false);
});

test("varies static pages on Accept without dropping Accept-Encoding", () => {
  expect(varyRoute).toMatchObject({
    headers: { Vary: "Accept, Accept-Encoding" },
    continue: true,
  });
});
