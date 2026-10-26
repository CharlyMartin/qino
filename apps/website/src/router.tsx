import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const staleTime = import.meta.env.DEV ? 0 : Infinity;

  return createRouter({
    routeTree,
    scrollRestoration: true,
    // Overrides the page's smooth scrolling, which is meant for in-page anchors, not route changes.
    scrollRestorationBehavior: "instant",
    defaultPreload: "intent",
    defaultStaleTime: staleTime,
    defaultPreloadStaleTime: staleTime,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
