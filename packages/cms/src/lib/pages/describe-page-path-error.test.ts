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
    ["//cdn.com", index, 'pages.index "//cdn.com" must stay on the site.'],
    ["/\\cdn.com", index, 'pages.index "/\\cdn.com" must stay on the site.'],
    ["/\t/cdn.com", index, 'pages.index "/\t/cdn.com" must stay on the site.'],
    [
      "/\n/cdn.com/{slug}",
      entry,
      'pages.entry "/\n/cdn.com/{slug}" must stay on the site.',
    ],
    [
      "/blog?page=1",
      index,
      'pages.index "/blog?page=1" must be a path, without "?" or "#".',
    ],
    [
      "/blog/../{slug}",
      entry,
      'pages.entry "/blog/../{slug}" must not contain "." or ".." segments.',
    ],
    [
      "/./blog",
      index,
      'pages.index "/./blog" must not contain "." or ".." segments.',
    ],
    [
      "/{slug}/%2e%2e/x",
      entry,
      'pages.entry "/{slug}/%2e%2e/x" must not contain "." or ".." segments.',
    ],
    [
      "/{slug}/.%2E/x",
      entry,
      'pages.entry "/{slug}/.%2E/x" must not contain "." or ".." segments.',
    ],
    [
      "/{slug}\\..\\x",
      entry,
      'pages.entry "/{slug}\\..\\x" must not contain "\\", tabs or line breaks.',
    ],
    [
      "/{slug}/\t../x",
      entry,
      'pages.entry "/{slug}/\t../x" must not contain "\\", tabs or line breaks.',
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
