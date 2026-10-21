import { docsTree } from "../../qino/docs";
import { postCollection } from "../../qino/posts";
import { buildLlmsTxt } from "../lib/build-llms-txt";

export async function getLlmsTxt() {
  const [flat, posts] = await Promise.all([
    docsTree.getFlatTree(),
    postCollection.getEntries(),
  ]);

  const links = await Promise.all(
    flat.map(async ({ slug }) => {
      const { title, description } = await docsTree.getEntry(slug);
      return { slug, title, description };
    }),
  );

  // Top-level nodes are sections; everything below lists under its section.
  const sections = links
    .filter((link) => !link.slug.includes("/"))
    .map((section) => ({
      ...section,
      pages: links.filter((link) => link.slug.startsWith(`${section.slug}/`)),
    }));

  return buildLlmsTxt({
    sections,
    posts: posts.map(({ _meta, title, description }) => ({
      slug: _meta.slug,
      title,
      description,
    })),
  });
}
