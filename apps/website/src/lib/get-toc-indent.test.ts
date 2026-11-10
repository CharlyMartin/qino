import { expect, test } from "vitest";

import { getTocIndent } from "./get-toc-indent";

test("indents one step per heading level", () => {
  expect(getTocIndent(0)).toBe("pl-3");
  expect(getTocIndent(1)).toBe("pl-6");
});

test("caps the indent at the deepest step", () => {
  expect(getTocIndent(9)).toBe("pl-18");
});
