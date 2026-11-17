import { expect, test } from "vitest";

import { hasPageRoute } from "./has-page-route";

test.each(["/", "/cloud", "/blog", "/blog/hello-qino", "/docs", "/docs/guide"])(
  "finds a route for %s",
  (pathname) => {
    expect(hasPageRoute(pathname)).toBe(true);
  },
);

test.each(["/__ora-404-probe-r7v4px6e", "/missing", "/cloud/missing"])(
  "finds no route for %s",
  (pathname) => {
    expect(hasPageRoute(pathname)).toBe(false);
  },
);
