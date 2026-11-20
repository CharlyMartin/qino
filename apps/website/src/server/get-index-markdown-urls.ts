import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { docsTree } from "../../qino/docs";
import { postCollection } from "../../qino/posts";

// The index pages' Markdown URLs, for their heads.
export const getIndexMarkdownUrls = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(() => ({
    docs: docsTree.getMarkdownUrl(),
    blog: postCollection.getMarkdownUrl(),
  }));
