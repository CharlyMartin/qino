import { createServerFn } from "@tanstack/react-start";

import { docsTree } from "../../qino/docs";
import { toDocsNode } from "./to-docs-node";

export const getDocsTree = createServerFn({ method: "GET" }).handler(
  async () => {
    return (await docsTree.getTree()).map(toDocsNode);
  },
);
