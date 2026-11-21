import { docsTree } from "../../qino/docs";
import { postCollection } from "../../qino/posts";

/**
 * Every docs page and post as written, for the content tests: its slug,
 * Markdown URL and body, and a docs page's heading ids. Posts have no `_toc`.
 */
export async function readContentPages() {
  const [nodes, postSlugs] = await Promise.all([
    docsTree.getFlatTree(),
    postCollection.getAllSlugs(),
  ]);
  return Promise.all([
    ...nodes.map(async ({ slug }) => {
      const { markdown, _toc } = await docsTree.getEntry(slug);
      return {
        slug,
        url: docsTree.getMarkdownUrl(slug),
        markdown,
        headingIds: new Set(_toc.map(({ id }) => id)),
      };
    }),
    ...postSlugs.map(async (slug) => ({
      slug,
      url: postCollection.getMarkdownUrl(slug),
      markdown: (await postCollection.getEntry(slug)).markdown,
      headingIds: undefined,
    })),
  ]);
}
