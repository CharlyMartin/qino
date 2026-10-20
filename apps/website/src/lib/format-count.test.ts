import { expect, test } from "vitest";

import { formatCount } from "./format-count";

test("keeps small counts as is", () => {
  expect(formatCount(12)).toBe("12");
});

test("compacts thousands and millions to one decimal", () => {
  expect(formatCount(1363)).toBe("1.4k");
  expect(formatCount(1_000_000)).toBe("1m");
});
