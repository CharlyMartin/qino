import { expect, test, vi } from "vitest";

import { buildNotFoundMarkdown } from "../lib/build-not-found-markdown";
import { getDocsMarkdown } from "./get-docs-markdown";
import { negotiateMarkdown } from "./negotiate-markdown";

const markdownHeaders = { Accept: "text/markdown" };

function request(path: string, init?: RequestInit) {
  return new Request(`https://www.qino.works${path}`, init);
}

function html(status = 200) {
  return vi.fn(
    async () =>
      new Response("<!DOCTYPE html>", {
        status,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          Vary: "Accept-Encoding",
        },
      }),
  );
}

test("answers Accept: text/markdown with the page's Markdown", async () => {
  const next = html();
  const response = await negotiateMarkdown({
    request: request("/docs/concepts", { headers: markdownHeaders }),
    next,
  });

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(response.headers.get("Vary")).toBe("Accept");
  expect(await response.text()).toBe(await getDocsMarkdown("concepts"));
  expect(next).not.toHaveBeenCalled();
});

test("serves a docs page requested with a trailing slash", async () => {
  const response = await negotiateMarkdown({
    request: request("/docs/guide/cli/", { headers: markdownHeaders }),
    next: html(),
  });

  expect(response.status).toBe(200);
  expect(await response.text()).toBe(await getDocsMarkdown("guide/cli"));
});

test("serves the homepage as Markdown", async () => {
  const response = await negotiateMarkdown({
    request: request("/", { headers: markdownHeaders }),
    next: html(),
  });

  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(await response.text()).toMatch(/^# qino\n/);
});

test("keeps HTML for browsers and adds Vary: Accept", async () => {
  const response = await negotiateMarkdown({
    request: request("/", {
      headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    }),
    next: html(),
  });

  expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  expect(response.headers.get("Vary")).toBe("Accept-Encoding, Accept");
  expect(await response.text()).toBe("<!DOCTYPE html>");
});

test("answers a missing page with a Markdown 404", async () => {
  const response = await negotiateMarkdown({
    request: request("/docs/missing", { headers: markdownHeaders }),
    next: html(404),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(response.headers.get("Vary")).toBe("Accept");
  expect(await response.text()).toBe(buildNotFoundMarkdown("/docs/missing"));
});

test("answers an unrouted path with a Markdown 404 before rendering", async () => {
  const next = html(406);
  const response = await negotiateMarkdown({
    request: request("/__ora-404-probe-r7v4px6e", { headers: markdownHeaders }),
    next,
  });

  expect(next).not.toHaveBeenCalled();
  expect(response.status).toBe(404);
  expect(await response.text()).toBe(
    buildNotFoundMarkdown("/__ora-404-probe-r7v4px6e"),
  );
});

test("turns a rendered 404 into Markdown", async () => {
  const response = await negotiateMarkdown({
    request: request("/blog/missing", {
      headers: { Accept: "text/markdown, text/html" },
    }),
    next: html(404),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(await response.text()).toBe(buildNotFoundMarkdown("/blog/missing"));
});

test("keeps the HTML 404 for browsers", async () => {
  const response = await negotiateMarkdown({
    request: request("/missing"),
    next: html(404),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  expect(response.headers.get("Vary")).toBe("Accept-Encoding, Accept");
});

test("falls back to HTML for a page without Markdown", async () => {
  const next = html();
  const response = await negotiateMarkdown({
    request: request("/cloud", { headers: markdownHeaders }),
    next,
  });

  expect(next).toHaveBeenCalledOnce();
  expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
  expect(response.headers.get("Vary")).toBe("Accept-Encoding, Accept");
});

test("sends headers without a body for HEAD", async () => {
  const response = await negotiateMarkdown({
    request: request("/docs/concepts", {
      method: "HEAD",
      headers: markdownHeaders,
    }),
    next: html(),
  });

  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(response.body).toBeNull();
});

test.each([
  ["GET", "/docs/concepts.md"],
  ["GET", "/llms.txt"],
  ["POST", "/docs/concepts"],
])("passes %s %s through untouched", async (method, path) => {
  const upstream = new Response("upstream");
  const response = await negotiateMarkdown({
    request: request(path, { method, headers: markdownHeaders }),
    next: async () => upstream,
  });

  expect(response).toBe(upstream);
});
