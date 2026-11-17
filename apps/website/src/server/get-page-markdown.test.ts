import { expect, test } from "vitest";

import { getDocsMarkdown } from "./get-docs-markdown";
import { getLlmsTxt } from "./get-llms-txt";
import { getPageMarkdown } from "./get-page-markdown";

test("serves llms.txt as the homepage's Markdown", async () => {
  expect(await getPageMarkdown("/")).toBe(await getLlmsTxt());
});

test.each(["concepts", "guide/cli"])(
  "serves the docs page %s as its .md file",
  async (slug) => {
    const markdown = await getPageMarkdown(`/docs/${slug}`);
    expect(markdown).toBe(await getDocsMarkdown(slug));
    expect(markdown).toMatch(/\S/);
  },
);

test.each(["/docs", "/docs/missing", "/blog/hello-qino", "/missing"])(
  "has no Markdown for %s",
  async (pathname) => {
    expect(await getPageMarkdown(pathname)).toBeNull();
  },
);
