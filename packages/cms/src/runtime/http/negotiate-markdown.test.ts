import { describe, expect, test } from "vitest";

import { negotiateMarkdown } from "./negotiate-markdown";

const markdownRequest = new Request("https://example.com/blog/hello", {
  headers: { Accept: "text/markdown" },
});

describe("negotiateMarkdown", () => {
  test("serves the loaded Markdown when the request accepts it", async () => {
    const response = await negotiateMarkdown(
      markdownRequest,
      () => "# Hello\n",
    );

    expect(response?.status).toBe(200);
    expect(await response?.text()).toBe("# Hello\n");
    expect(response?.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");
  });

  test("resolves to null without loading when the request wants HTML", async () => {
    const request = new Request("https://example.com/blog/hello", {
      headers: { Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    let loaded = false;

    const response = await negotiateMarkdown(request, () => {
      loaded = true;
      return "# Hello\n";
    });

    expect(response).toBeNull();
    expect(loaded).toBe(false);
  });

  test("resolves to null rather than 406 for a type it can't serve", async () => {
    const request = new Request("https://example.com/blog/hello", {
      headers: { Accept: "application/x-content-negotiation-probe" },
    });

    expect(await negotiateMarkdown(request, () => "# Hello\n")).toBeNull();
  });

  test("waits for an async loader", async () => {
    const response = await negotiateMarkdown(
      markdownRequest,
      async () => "# Hello\n",
    );

    expect(await response?.text()).toBe("# Hello\n");
  });

  test("serves Markdown for a path ending in .md, whatever Accept says", async () => {
    const request = new Request("https://example.com/blog/hello.md", {
      headers: { Accept: "text/html" },
    });

    const response = await negotiateMarkdown(request, () => "# Hello\n");

    expect(response?.status).toBe(200);
    expect(await response?.text()).toBe("# Hello\n");
  });

  test("answers a Markdown 404 linking to llms.txt when nothing loads", async () => {
    const response = await negotiateMarkdown(markdownRequest, () => null);

    expect(response?.status).toBe(404);
    expect(response?.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(response?.headers.get("Vary")).toBe("Accept");
    expect(await response?.text()).toBe(
      "# Not found\n\nThis page doesn't exist. See https://example.com/llms.txt for the pages that do.\n",
    );
  });

  test("answers HEAD with the same status and headers, and no body", async () => {
    const request = new Request(markdownRequest, { method: "HEAD" });

    const found = await negotiateMarkdown(request, () => "# Hello\n");
    const missing = await negotiateMarkdown(request, () => null);

    expect(found?.status).toBe(200);
    expect(found?.headers.get("Content-Type")).toBe(
      "text/markdown; charset=utf-8",
    );
    expect(found?.body).toBeNull();
    expect(missing?.status).toBe(404);
    expect(missing?.body).toBeNull();
  });
});
