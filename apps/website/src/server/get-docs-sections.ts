import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { docsTree } from "../../qino/docs";
import { getDocsLinks } from "./get-docs-links";

export const getDocsSections = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const nodes = await docsTree.getTree();

    return Promise.all(
      nodes.map(async (node) => {
        const [{ title, description }, links] = await Promise.all([
          docsTree.getEntry(node.slug),
          getDocsLinks(node),
        ]);
        return { slug: node.slug, title, description, links };
      }),
    );
  });
