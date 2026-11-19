import { describe, expect, test } from "vitest";

import { describePagePathError } from "./describe-page-path-error";

const index = { label: "pages.index", takesSlug: false };
const entry = { label: "pages.entry", takesSlug: true };

describe("describePagePathError", () => {
  test.each(["/", "/blog", "/blog/"])("accepts the index path %j", (path) => {
    expect(describePagePathError(path, index)).toBeUndefined();
  });

  test.each(["/{slug}", "/blog/{slug}", "/blog/{slug}/", "/{slug}.html"])(
    "accepts the entry path %j",
    (path) => {
      expect(describePagePathError(path, entry)).toBeUndefined();
    },
  );

  test.each([
    ["blog", index, 'pages.index "blog" must start with "/".'],
    [
      "//cdn.com",
      index,
      'pages.index "//cdn.com" must be a path on the site, not "//".',
    ],
    [
      "/blog?page=1",
      index,
      'pages.index "/blog?page=1" must be a path, without "?" or "#".',
    ],
    ["/blog/{slug}", index, 'pages.index "/blog/{slug}" takes no token.'],
    ["/blog", entry, 'pages.entry "/blog" must contain {slug} once.'],
    [
      "/{slug}/{slug}",
      entry,
      'pages.entry "/{slug}/{slug}" must contain {slug} once.',
    ],
    [
      "/{lang}/{slug}",
      entry,
      'pages.entry "/{lang}/{slug}" takes no token but {slug}.',
    ],
  ])("rejects %j", (path, options, message) => {
    expect(describePagePathError(path, options)).toBe(message);
  });
});
