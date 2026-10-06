import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

import { snippetCollection } from "../../qino/snippets";
import { highlightSnippet } from "./highlight-snippet";

export const getSnippets = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler(async () => {
    const [pipelineFiles, pipelineDefine, pipelineQuery, relationsPosts] =
      await Promise.all(
        [
          "pipeline-files",
          "pipeline-define",
          "pipeline-query",
          "relations-posts",
        ].map(getSnippet),
      );

    return { pipelineFiles, pipelineDefine, pipelineQuery, relationsPosts };
  });

async function getSnippet(slug: string) {
  const { label, markdown } = await snippetCollection.getEntry(slug);
  return { label, html: highlightSnippet(markdown) };
}
