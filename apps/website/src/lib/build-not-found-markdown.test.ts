import { expect, test } from "vitest";

import { buildNotFoundMarkdown } from "./build-not-found-markdown";

test("names the missing path and links to absolute recovery URLs", () => {
  expect(buildNotFoundMarkdown("/missing")).toBe(
    `# Page not found

There is no page at \`/missing\` on https://www.qino.works.

- [llms.txt](https://www.qino.works/llms.txt): Every documentation page, as Markdown links
- [llms-full.txt](https://www.qino.works/llms-full.txt): The full documentation in one file
- [Sitemap](https://www.qino.works/sitemap.xml): Every page on the site
`,
  );
});
