import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { docsTree } from "../../qino/docs";
import { toDocsNode } from "./to-docs-node";

export const getDocsTree = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    return (await docsTree.getTree()).map(toDocsNode);
  });
