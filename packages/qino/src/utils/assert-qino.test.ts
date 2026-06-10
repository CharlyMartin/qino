import { describe, expect, test } from "vitest";

import { assertQino } from "./assert-qino";
import { makeDummyCollection, makeDummyQino } from "./tests";

describe("assertQino", () => {
  test("does not throw for a Qino instance", () => {
    expect(() => assertQino(makeDummyQino())).not.toThrow();
  });

  test("throws for a primitive", () => {
    expect(() =>
      assertQino(
        makeDummyCollection({ directory: "/posts", extension: ".md" }),
      ),
    ).toThrow();
  });

  test("throws for a plain object", () => {
    expect(() => assertQino({})).toThrow();
  });

  test("uses the provided message", () => {
    expect(() => assertQino(null, "custom message")).toThrow("custom message");
  });
});
