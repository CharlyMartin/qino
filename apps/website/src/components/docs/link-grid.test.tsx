import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { LinkGrid } from "./link-grid";

async function renderLinkGrid(
  links: Array<{ slug: string; title: string; description: string }>,
) {
  const root = createRootRoute();
  const docsPage = createRoute({
    getParentRoute: () => root,
    path: "/docs/$",
    loader: () => ({ links }),
    component: LinkGrid,
  });
  const router = createRouter({
    routeTree: root.addChildren([docsPage]),
    history: createMemoryHistory({ initialEntries: ["/docs/guide"] }),
  });
  await router.load();

  return renderToStaticMarkup(<RouterProvider router={router} />);
}

test("renders a card per link with title and description", async () => {
  const html = await renderLinkGrid([
    { slug: "guide/cli", title: "CLI", description: "The qino command." },
    {
      slug: "guide/installation",
      title: "Installation",
      description: "Add Qino to a project.",
    },
  ]);

  expect(html).toContain('aria-label="Pages in this section"');
  expect(html).toContain('href="/docs/guide/cli"');
  expect(html).toContain('href="/docs/guide/installation"');
  expect(html).toContain(">CLI</span>");
  expect(html).toContain(">The qino command.</span>");
  expect(html).toContain(">Add Qino to a project.</span>");
});

test("renders nothing without links", async () => {
  const html = await renderLinkGrid([]);

  expect(html).not.toContain("<nav");
});
