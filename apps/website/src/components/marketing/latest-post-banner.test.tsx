import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import {
  LatestPostBanner,
  type LatestPostBannerProps,
} from "./latest-post-banner";

async function renderLatestPostBanner(post: LatestPostBannerProps) {
  const root = createRootRoute();
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <LatestPostBanner {...post} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([home]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("links to the post, with its title", async () => {
  const html = await renderLatestPostBanner({
    slug: "qino-0-23",
    title: "qino 0.23: 8× faster builds on large content",
  });

  expect(html).toContain('href="/blog/qino-0-23"');
  expect(html).toContain(">New post</span>");
  expect(html).toContain(
    ">qino 0.23: 8× faster builds on large content</span>",
  );
});
