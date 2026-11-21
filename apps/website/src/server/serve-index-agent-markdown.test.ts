import { expect, test } from "vitest";

import { serveIndexAgentMarkdown } from "./serve-index-agent-markdown";

const load = () => "# Docs\n";

test("serves the agent Markdown at the Markdown URL, whatever Accept says", async () => {
  const request = new Request("https://www.qino.works/docs.md", {
    headers: { Accept: "text/html" },
  });

  const response = await serveIndexAgentMarkdown(request, load);

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe(
    "text/markdown; charset=utf-8",
  );
  expect(await response.text()).toBe("# Docs\n");
});

test("redirects a trailing slash to the Markdown URL", async () => {
  const request = new Request("https://www.qino.works/docs.md/?a=1");

  const response = await serveIndexAgentMarkdown(request, load);

  expect(response.status).toBe(307);
  expect(response.headers.get("Location")).toBe(
    "https://www.qino.works/docs.md?a=1",
  );
});
