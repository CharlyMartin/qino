import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";
import { postCollection } from "../../qino/posts";

// Fenced code blocks, which hold code as written.
const FENCES = /^```[^\n]*\n[\s\S]*?^```$/gm;

// CommonMark has no escapes in a code span, so `\`` ends it there: a span
// holding a backtick takes double backticks, as in `` a `b` ``.
test("no code span escapes a backtick", async () => {
  const [nodes, postSlugs] = await Promise.all([
    docsTree.getFlatTree(),
    postCollection.getAllSlugs(),
  ]);
  const pages = await Promise.all([
    ...nodes.map(async ({ slug }) => ({
      url: docsTree.getMarkdownUrl(slug),
      markdown: (await docsTree.getEntry(slug)).markdown,
    })),
    ...postSlugs.map(async (slug) => ({
      url: postCollection.getMarkdownUrl(slug),
      markdown: (await postCollection.getEntry(slug)).markdown,
    })),
  ]);

  const escapes = pages.flatMap(({ url, markdown }) =>
    markdown
      .replace(FENCES, "")
      .split("\n")
      // `\` alone is a code span holding a backslash.
      .filter((line) => line.replaceAll("`\\`", "").includes("\\`"))
      .map((line) => `${url}: ${line.trim()}`),
  );
  expect(escapes).toEqual([]);
});
