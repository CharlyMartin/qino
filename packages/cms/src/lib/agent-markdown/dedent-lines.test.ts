import { expect, test } from "vitest";

import { dedentLines } from "./dedent-lines";

test("removes up to the indent from each line after the first", () => {
  expect(dedentLines("a\n  b\n    c\nd", "  ")).toBe("a\nb\n  c\nd");
});
