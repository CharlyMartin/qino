import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { z } from "zod";

import { docsTree } from "../../qino/docs";
import { getDocsLinks } from "./get-docs-links";
import { serializeMdx } from "./serialize-mdx";
import { toDocsNode } from "./to-docs-node";

export const getDocsPage = createServerFn({ method: "GET" })
  .validator(z.string())
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slug }) => {
    const flat = await docsTree.getFlatTree();
    const node = flat.find((candidate) => candidate.slug == slug);
    if (!node) throw notFound();

    const [entry, ancestors, previousNode, nextNode, links] = await Promise.all(
      [
        docsTree.getEntry(node.slug),
        docsTree.getAncestors(node.slug),
        docsTree.getPreviousNode(node.slug),
        docsTree.getNextNode(node.slug),
        getDocsLinks(node),
      ],
    );

    const breadcrumbs = [...ancestors, node].map(({ slug, title }) => ({
      slug,
      title,
    }));

    const mdx = await serializeMdx(entry.markdown);

    return {
      slug,
      title: entry.title,
      description: entry.description,
      since: entry.since,
      raw: entry.raw,
      mdx,
      links,
      breadcrumbs,
      previousNode: previousNode ? toDocsNode(previousNode) : null,
      nextNode: nextNode ? toDocsNode(nextNode) : null,
    };
  });
