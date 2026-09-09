import { expect, test } from "vitest";

import { assertViewNames } from "./assert-view-names";

test("assertViewNames reserves default", () => {
  expect(() => assertViewNames({ default: {} })).toThrow(/reserved/);
  expect(() => assertViewNames(undefined)).not.toThrow();
  expect(() => assertViewNames({ detail: {} })).not.toThrow();
});
