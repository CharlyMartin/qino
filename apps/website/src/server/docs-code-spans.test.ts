import { expect, test } from "vitest";

import { readContentPages } from "./read-content-pages";

// Fenced code blocks, which hold code as written.
const FENCES = /^```[^\n]*\n[\s\S]*?^```$/gm;

// CommonMark has no escapes in a code span, so `\`` ends it there: a span
// holding a backtick takes double backticks, as in `` a `b` ``.
test("no code span escapes a backtick", async () => {
  const pages = await readContentPages();
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
