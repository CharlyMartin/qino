import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  defaultParseSearch,
  RouterProvider,
} from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { MdxLink } from "./mdx-link";

test.each([
  "/docs",
  "/docs/guide",
  "/docs/api/tree/get-tree",
  "/docs/guide?language=en&tag=one&tag=two#installation",
  "/docs/guide?count=2&enabled=true#heading",
  "/docs/guide#hello%20world",
  "/docs/a%20page",
  "/docs/%invalid",
  "/docs/../elsewhere",
  "/docs-other",
  "#heading",
  "https://example.com/docs/guide",
  "//example.com/docs/guide",
  "mailto:hello@example.com",
])("preserves the destination and anchor attributes for %s", async (href) => {
  const root = createRootRoute({
    component: () => (
      <MdxLink href={href} title="Details" target="_blank" rel="noreferrer">
        Read more
      </MdxLink>
    ),
  });
  const router = createRouter({
    routeTree: root,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  await router.load();

  const html = renderToStaticMarkup(<RouterProvider router={router} />);
  const renderedHref = html.match(/href="([^"]*)"/)?.[1];
  expect(renderedHref).toBeDefined();
  const actual = new URL(
    renderedHref?.replaceAll("&amp;", "&") ?? "",
    "https://qino.invalid",
  );
  const expected = new URL(href, "https://qino.invalid");
  expect(actual.origin).toBe(expected.origin);
  expect(actual.pathname).toBe(expected.pathname);
  expect(actual.hash).toBe(expected.hash);
  expect(defaultParseSearch(actual.search)).toEqual(
    defaultParseSearch(expected.search),
  );
  expect(html).toContain('title="Details"');
  expect(html).toContain('target="_blank"');
  expect(html).toContain('rel="noreferrer"');
  expect(html).toContain("Read more</a>");
});

test.each([true, "", "guide.html"])(
  "download=%s uses a native anchor without requiring a router",
  (download) => {
    const html = renderToStaticMarkup(
      <MdxLink href="/docs/guide" download={download}>
        Download guide
      </MdxLink>,
    );
    expect(html).toContain('href="/docs/guide"');
    expect(html).toContain(
      `download="${typeof download == "string" ? download : ""}"`,
    );
  },
);
