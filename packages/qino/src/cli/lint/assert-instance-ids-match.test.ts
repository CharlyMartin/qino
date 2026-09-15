import { describe, expect, test } from "vitest";

import { DUMMY_INSTANCE_ID } from "../../test-utils/dummy-config";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
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
