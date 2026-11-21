import { negotiateMarkdown } from "@qino/cms";
import { createMiddleware } from "@tanstack/react-start";

// A 404 becomes the Markdown 404 when the request wants Markdown, on paths
// no route answers with Markdown, such as `/nope` or `/blog/a/b.md`.
export const markdownNotFoundMiddleware = createMiddleware().server(
  async ({ request, handlerType, next }) => {
    const result = await next();
    if (handlerType != "router" || result.response.status != 404) {
      return result;
    }
    return (await negotiateMarkdown(request, async () => null)) ?? result;
  },
);
