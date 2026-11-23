import { expect, test } from "vitest";

import { serveIndexPageMarkdown } from "./serve-index-page-markdown";

const load = () => "# Docs\n";

test("serves the page Markdown at the Markdown URL, whatever Accept says", async () => {
  const request = new Request("https://www.qino.works/docs.md", {
    headers: { Accept: "text/html" },
  });

  const response = await serveIndexPageMarkdown(request, load);

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(await response.text()).toBe("# Docs\n");
});

test("redirects a trailing slash to the Markdown URL", async () => {
  const request = new Request("https://www.qino.works/docs.md/?a=1");

  const response = await serveIndexPageMarkdown(request, load);

  expect(response.status).toBe(307);
  expect(response.headers.get("Location")).toBe(
    "https://www.qino.works/docs.md?a=1",
  );
});
