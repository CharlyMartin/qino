import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";
import { postCollection } from "../../qino/posts";

// A link to a docs page, `[x](/docs/<slug>#<id>)`, and one within the page.
const DOCS_LINKS = /\]\(\/docs\/([^)#\s]*)(?:#([^)\s]+))?\)/g;
const PAGE_LINKS = /\]\(#([^)\s]+)\)/g;

test("every docs link names a page and a heading that exist", async () => {
  const [nodes, postSlugs] = await Promise.all([
    docsTree.getFlatTree(),
    postCollection.getAllSlugs(),
  ]);
  const headingIds = new Map(
    await Promise.all(
      nodes.map(async ({ slug }) => {
        const { _toc } = await docsTree.getEntry(slug);
        return [slug, new Set(_toc.map(({ id }) => id))] as const;
      }),
    ),
  );
  const pages = await Promise.all([
    ...nodes.map(async ({ slug }) => ({
      slug,
      markdown: (await docsTree.getEntry(slug)).markdown,
    })),
    ...postSlugs.map(async (slug) => ({
      slug: undefined,
      markdown: (await postCollection.getEntry(slug)).markdown,
    })),
  ]);

  const broken = [];
  for (const { slug, markdown } of pages) {
    for (const [link, target = "", id] of markdown.matchAll(DOCS_LINKS)) {
      const ids = headingIds.get(target);
      if (!ids || (id && !ids.has(id))) broken.push(`${slug}: ${link}`);
    }
    for (const [link, id = ""] of markdown.matchAll(PAGE_LINKS)) {
      if (slug && !headingIds.get(slug)?.has(id))
        broken.push(`${slug}: ${link}`);
    }
  }
  expect(broken).toEqual([]);
});
