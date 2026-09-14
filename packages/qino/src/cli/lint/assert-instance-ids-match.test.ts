import { describe, expect, test } from "vitest";

import {
  DUMMY_INSTANCE_ID,
  makeDummyCollection,
  makeDummyItem,
} from "../../utils/tests";
import { assertInstanceIdsMatch } from "./assert-instance-ids-match";

describe("assertInstanceIdsMatch", () => {
  test("does not throw when all instance ids match", () => {
    const primitives = [
      makeDummyCollection({ directory: "/posts", extension: ".md" }),
      makeDummyItem({ file: "/settings.json" }),
    ];

    expect(() =>
      assertInstanceIdsMatch(primitives, DUMMY_INSTANCE_ID),
    ).not.toThrow();
  });

  test("does not throw for an empty array", () => {
    expect(() => assertInstanceIdsMatch([], DUMMY_INSTANCE_ID)).not.toThrow();
  });

  test("throws when a primitive has a different instance id", () => {
    const primitives = [
      makeDummyCollection({ directory: "/posts", extension: ".md" }),
      makeDummyItem({
        file: "/settings.json",
        instanceId: Symbol.for("qino.tests.other"),
      }),
    ];

    expect(() =>
      assertInstanceIdsMatch(primitives, DUMMY_INSTANCE_ID),
    ).toThrow();
  });
});
