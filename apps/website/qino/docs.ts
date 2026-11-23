import { z } from "zod";

import { installBoxToMarkdown } from "../src/lib/install-box-to-markdown";
import qino from "./index";

export const docsTree = qino.defineTree({
  directory: "docs",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      since: z.string().optional(),
    })
    .strict(),
  extension: ".mdx",
  titleField: "title",
  markdown: { toc: { upTo: "h3" } },
  pages: {
    index: "/docs",
    entry: "/docs/{slug}",
    title: "Docs",
    markdownComponents: {
      InstallBox: installBoxToMarkdown,
      // The page's children, as the rendered grid shows them. Annotated, as it
      // reads `docsTree`, whose type it's part of.
      LinkGrid: async ({ entry }): Promise<string> => {
        const node = await docsTree.getTree(entry._meta.slug);
        const links = await Promise.all(
          node.children.map(async (child) => {
            const { description } = await docsTree.getEntry(child.slug);
            return `- [${child.title}](${docsTree.getMarkdownUrl(child.slug)}): ${description}`;
          }),
        );
        return links.join("\n");
      },
    },
  },
});
