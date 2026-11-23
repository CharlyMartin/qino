import { expect, test } from "vitest";

import { toEntrySlug } from "./to-entry-slug";

test.each([
  ["guide/cli", "guide/cli"],
  ["guide/cli.md", "guide/cli"],
  ["guide/cli/", "guide/cli"],
  ["guide/cli.md/", "guide/cli"],
  ["hello-qino.md", "hello-qino"],
  ["notes.md.md", "notes.md"],
])("reads %j as the slug %j", (param, slug) => {
  expect(toEntrySlug(param)).toBe(slug);
});
