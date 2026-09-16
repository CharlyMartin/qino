import { expect, test } from "vitest";

import { assertNoRootViewSettings } from "./assert-no-root-view-settings";

test.each([
  "resolveRelations",
  "augment",
  "filter",
  "sort",
])("rejects root %s settings", (key) => {
  for (const value of [null, false, () => ({})]) {
    expect(() => assertNoRootViewSettings({ [key]: value })).toThrow(
      `Configure "${key}" inside views.default or a custom view`,
    );
  }
  expect(() => assertNoRootViewSettings({ [key]: undefined })).not.toThrow();
});
