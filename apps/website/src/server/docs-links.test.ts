import { expect, test } from "vitest";

import { readContentPages } from "./read-content-pages";

// A link to a docs page, `[x](/docs/<slug>#<id> "title")`, and one within the
// page, `[x](#<id>)`.
const DOCS_LINKS = /\]\(\/docs\/([^)#\s]*)(?:#([^)\s]+))?(?:\s+"[^"]*")?\)/g;
const PAGE_LINKS = /\]\(#([^)\s]+)(?:\s+"[^"]*")?\)/g;

test("every docs link names a page and a heading that exist", async () => {
  const pages = await readContentPages();
  const docsHeadingIds = new Map(
    pages.flatMap(({ slug, headingIds }) =>
      headingIds ? [[slug, headingIds] as const] : [],
    ),
  );

  const broken = [];
  for (const { url, markdown, headingIds } of pages) {
    for (const [link, target = "", id] of markdown.matchAll(DOCS_LINKS)) {
      const ids = docsHeadingIds.get(target);
      if (!ids || (id && !ids.has(id))) broken.push(`${url}: ${link}`);
    }
    for (const [link, id = ""] of markdown.matchAll(PAGE_LINKS)) {
      // A post has no `_toc` to check the id against.
      if (!headingIds?.has(id)) broken.push(`${url}: ${link}`);
    }
  }
  expect(broken).toEqual([]);
});
