import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { z } from "zod";

import { docsTree } from "../../qino/docs";
import { serializeMdx } from "./serialize-mdx";
import { toDocsNode } from "./to-docs-node";

export const getDocsPage = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const flat = await docsTree.getFlatTree();
    const node = flat.find((candidate) => candidate.slug == slug);
    if (!node) throw notFound();

    const [entry, previousNode, nextNode, links] = await Promise.all([
      docsTree.getEntry(node.slug),
      docsTree.getPreviousNode(node.slug),
      docsTree.getNextNode(node.slug),
      Promise.all(
        node.children.map(async (child) => {
          const { title, description } = await docsTree.getEntry(child.slug);
          return { slug: child.slug, title, description };
        }),
      ),
    ]);

    const mdx = await serializeMdx(entry.markdown);

    return {
      slug,
      title: entry.title,
      description: entry.description,
      since: entry.since,
      raw: entry.raw,
      mdx,
      links,
      previousNode: previousNode ? toDocsNode(previousNode) : null,
      nextNode: nextNode ? toDocsNode(nextNode) : null,
    };
  });
