import { describe, expect, test } from "vitest";

import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyQino } from "../../test-utils/make-dummy-qino";
import { assertQino } from "./assert-qino";

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
