import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { SiteBreadcrumb } from "../../types/site-breadcrumb";
import { SiteBreadcrumbs } from "./site-breadcrumbs";

async function renderSiteBreadcrumbs(
  url: string,
  breadcrumbs: Array<SiteBreadcrumb>,
) {
  const root = createRootRoute();
  const page = createRoute({
    getParentRoute: () => root,
    path: "$",
    component: () => <SiteBreadcrumbs breadcrumbs={breadcrumbs} />,
  });
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  await router.load();

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("links the crumbs above the page and marks only the page as current", async () => {
  const html = await renderSiteBreadcrumbs("/docs/api/collection", [
    { title: "Docs", link: { to: "/docs" } },
    { title: "API", link: { to: "/docs/$", params: { _splat: "api" } } },
    { title: "Collection" },
  ]);

  expect(html).toContain('href="/docs"');
  expect(html).toContain('href="/docs/api"');
  expect(html).toMatch(/aria-current="page"[^>]*>Collection<\/li>/);
  expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  expect(html).not.toContain(">Collection</a>");
});

test("opens each crumb with a slash, so the first follows the logo", async () => {
  const html = await renderSiteBreadcrumbs("/blog/hello-world", [
    { title: "Blog", link: { to: "/blog" } },
    { title: "Hello world" },
  ]);

  expect(html.match(/aria-hidden="true"[^>]*>\/<\/li>/g)).toHaveLength(2);
});
