import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

import { negotiateMarkdown } from "./server/negotiate-markdown";

// Defining a Start instance drops Start's default CSRF check, so restate it as is.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType == "serverFn",
});

const markdownMiddleware = createMiddleware().server(
  async ({ request, next, handlerType }) => {
    if (handlerType != "router") return next();
    return negotiateMarkdown({
      request,
      next: async () => (await next()).response,
    });
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, markdownMiddleware],
}));
