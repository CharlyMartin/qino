import { expect, test } from "vitest";

import { formatVersion } from "./format-version";

test("drops a zero patch", () => {
  expect(formatVersion("0.13.0")).toBe("0.13");
  expect(formatVersion("1.0.0")).toBe("1.0");
});

test("keeps a non-zero patch", () => {
  expect(formatVersion("0.13.1")).toBe("0.13.1");
  expect(formatVersion("0.13.10")).toBe("0.13.10");
});
