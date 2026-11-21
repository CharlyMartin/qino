import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { htmlFallbackMiddleware } from "./server/html-fallback-middleware";
import { markdownNotFoundMiddleware } from "./server/markdown-not-found-middleware";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    // Start's default for server functions, dropped once this list is set.
    createCsrfMiddleware({
      filter: ({ handlerType }) => handlerType == "serverFn",
    }),
    htmlFallbackMiddleware,
    markdownNotFoundMiddleware,
  ],
}));
