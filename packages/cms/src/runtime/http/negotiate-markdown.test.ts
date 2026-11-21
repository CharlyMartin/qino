import { describe, expect, test } from "vitest";

import { negotiateMarkdown } from "./negotiate-markdown";

const loadHello = () => "# Hello\n";

const markdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
};

function requestPage(accept?: string, path = "/blog/hello") {
  return new Request(`https://example.com${path}`, {
    headers: accept == null ? {} : { Accept: accept },
  });
}

function headersOf(response: Response | null) {
  return {
    "Content-Type": response?.headers.get("Content-Type"),
    Vary: response?.headers.get("Vary"),
  };
}

describe("negotiateMarkdown", () => {
  test("serves the agent Markdown when the request prefers it", async () => {
    const response = await negotiateMarkdown(
      requestPage("text/markdown"),
      loadHello,
    );

    expect(response?.status).toBe(200);
    expect(headersOf(response)).toEqual(markdownHeaders);
    expect(await response?.text()).toBe("# Hello\n");
  });

  test.each([
    "text/markdown",
    "text/x-markdown",
    "text/markdown, text/html, */*",
    "text/html;q=0.9, text/markdown",
    'text/html;note="a,b";q=0.5, text/markdown',
  ])("serves agent Markdown for Accept: %s", async (accept) => {
    const response = await negotiateMarkdown(requestPage(accept), loadHello);

    expect(response?.status).toBe(200);
  });

  test.each([
    "text/html,application/xhtml+xml,*/*;q=0.8",
    "text/html;q=1, text/markdown;q=0.5",
    "text/html, text/markdown",
    "*/*",
    "text/*",
    "text/plain",
    "text/markdown;q=0",
    'text/markdown;note="a,b";q=0, text/html',
    'text/markdown;note="x;q=1";q=0, text/html',
    "application/x-content-negotiation-probe",
    undefined,
  ])("resolves to null, never 406, for Accept: %s", async (accept) => {
    const response = await negotiateMarkdown(requestPage(accept), loadHello);

    expect(response).toBeNull();
  });

  test("doesn't load the agent Markdown when the request wants HTML", async () => {
    let loaded = false;

    await negotiateMarkdown(requestPage("text/html"), () => {
      loaded = true;
      return "# Hello\n";
    });

    expect(loaded).toBe(false);
  });

  test("waits for an async loader", async () => {
    const response = await negotiateMarkdown(
      requestPage("text/markdown"),
      async () => "# Hello\n",
    );

    expect(await response?.text()).toBe("# Hello\n");
  });

  test("serves agent Markdown at a Markdown URL, whatever Accept says", async () => {
    const response = await negotiateMarkdown(
      requestPage("text/html", "/blog/hello.md?ref=llms"),
      loadHello,
    );

    expect(response?.status).toBe(200);
    expect(await response?.text()).toBe("# Hello\n");
  });

  test("answers a Markdown 404 linking to llms.txt when nothing loads", async () => {
    const response = await negotiateMarkdown(
      requestPage("text/markdown"),
      () => null,
    );

    expect(response?.status).toBe(404);
    expect(headersOf(response)).toEqual(markdownHeaders);
    expect(await response?.text()).toBe(
      "# Not found\n\nThis page doesn't exist. See [llms.txt](https://example.com/llms.txt) for the pages that do.\n",
    );
  });

  test("answers HEAD with the same status and headers, and no body", async () => {
    const request = new Request(requestPage("text/markdown"), {
      method: "HEAD",
    });

    const found = await negotiateMarkdown(request, loadHello);
    const missing = await negotiateMarkdown(request, () => null);

    expect(found?.status).toBe(200);
    expect(headersOf(found)).toEqual(markdownHeaders);
    expect(found?.body).toBeNull();
    expect(missing?.status).toBe(404);
    expect(headersOf(missing)).toEqual(markdownHeaders);
    expect(missing?.body).toBeNull();
  });
});
