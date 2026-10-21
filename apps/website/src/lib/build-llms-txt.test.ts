import { expect, test } from "vitest";

import { buildLlmsTxt } from "./build-llms-txt";

const llmsTxt = buildLlmsTxt({
  sections: [
    {
      slug: "guide",
      title: "Guide",
      description: "Install qino.",
      pages: [{ slug: "guide/cli", title: "CLI", description: "Run the CLI." }],
    },
  ],
  posts: [{ slug: "hello-qino", title: "Hello", description: "Announcing." }],
});

test("starts with the site name and a summary blockquote", () => {
  expect(llmsTxt).toMatch(/^# qino\n\n> /);
});

test("lists docs pages as Markdown links under their section", () => {
  expect(llmsTxt).toContain(
    "## Guide\n\n- [Guide](https://www.qino.works/docs/guide.md): Install qino.\n- [CLI](https://www.qino.works/docs/guide/cli.md): Run the CLI.",
  );
});

test("lists blog posts", () => {
  expect(llmsTxt).toContain(
    "## Blog\n\n- [Hello](https://www.qino.works/blog/hello-qino): Announcing.",
  );
});
