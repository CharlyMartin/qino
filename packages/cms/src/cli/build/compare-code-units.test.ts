import { describe, expect, test } from "vitest";

import { compareCodeUnits } from "./compare-code-units";

describe("compareCodeUnits", () => {
  test("orders by UTF-16 code units, not locale", () => {
    expect(
      ["zebra", "äpple", "apple", "Zebra"].toSorted(compareCodeUnits),
    ).toEqual(["Zebra", "apple", "zebra", "äpple"]);
  });

  test("returns 0 for equal strings", () => {
    expect(compareCodeUnits("posts", "posts")).toBe(0);
  });
});
