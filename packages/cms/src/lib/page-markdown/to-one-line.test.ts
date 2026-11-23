import { expect, test } from "vitest";

import { toOneLine } from "./to-one-line";

test("puts text on one line, trimmed", () => {
  expect(toOneLine(" Two\r\n\n  lines.\t")).toBe("Two lines.");
});
