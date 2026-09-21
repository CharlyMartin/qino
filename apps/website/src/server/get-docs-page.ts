import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { serialize } from "next-mdx-remote/serialize";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { z } from "zod";

import { docsTree } from "../../qino/docs";
import { toDocsNode } from "./to-docs-node";

export const getDocsPage = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const flat = await docsTree.getFlatTree();
    const node = flat.find((candidate) => candidate.slug == slug);
    if (!node) throw notFound();

    const [entry, previousNode, nextNode] = await Promise.all([
      docsTree.getEntry(node.slug),
      docsTree.getPreviousNode(node.slug),
      docsTree.getNextNode(node.slug),
    ]);

    const mdx = await serialize<Record<string, never>, Record<string, never>>(
      entry.markdown,
      {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            rehypeHighlight,
          ],
        },
      },
    );

    return {
      slug,
      title: entry.title,
      description: entry.description,
      since: entry.since,
      mdx,
      children: node.children.map(toDocsNode),
      previousNode: previousNode ? toDocsNode(previousNode) : null,
      nextNode: nextNode ? toDocsNode(nextNode) : null,
    };
  });
