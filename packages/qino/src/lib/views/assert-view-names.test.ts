import { expect, test } from "vitest";

import { assertViewNames } from "./assert-view-names";

test("requires an own default only when views are supplied", () => {
  expect(() => assertViewNames(undefined)).not.toThrow();
  expect(() => assertViewNames({ default: {} })).not.toThrow();
  expect(() => assertViewNames({ default: {}, detail: {} })).not.toThrow();
  for (const views of [{}, { detail: {} }, Object.create({ default: {} })]) {
    expect(() => assertViewNames(views)).toThrow(
      /must return a "default" view/,
    );
  }
});
