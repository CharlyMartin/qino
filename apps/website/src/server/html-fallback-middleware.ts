import { createMiddleware } from "@tanstack/react-start";

// Start's own test: a page renders only when `Accept` names HTML or `*/*`.
const ACCEPTS_HTML = /(^|,)\s*(\*\/\*|text\/html)/;

// Start answers 406 to any other `Accept`, such as `text/plain` or
// `text/markdown` alone. Adding `*/*;q=0` makes HTML the fallback instead, and
// lets an unknown path reach its 404. It never changes what
// `negotiateMarkdown` picks.
export const htmlFallbackMiddleware = createMiddleware().server(
  ({ request, handlerType, next }) => {
    const accept = request.headers.get("Accept");
    if (handlerType == "router" && accept && !ACCEPTS_HTML.test(accept)) {
      request.headers.set("Accept", `${accept}, */*;q=0`);
    }
    return next();
  },
);
