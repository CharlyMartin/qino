import { expect, test } from "vitest";

import { isWebUrl } from "./is-web-url";

test("accepts http and https URLs", () => {
  expect(isWebUrl("https://www.qino.works/docs")).toBe(true);
  expect(isWebUrl("http://localhost:3000")).toBe(true);
});

test("rejects relative, malformed, and non-web URLs", () => {
  expect(isWebUrl("/docs/guide")).toBe(false);
  expect(isWebUrl("https://")).toBe(false);
  expect(isWebUrl("javascript:alert(1)")).toBe(false);
});
