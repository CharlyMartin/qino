import { describe, expect, test } from "vitest";

import { DUMMY_INSTANCE_ID } from "../../test-utils/dummy-config";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { makeDummyTree } from "../../test-utils/make-dummy-tree";
import { assertRelationInstanceIds } from "./assert-relation-instance-ids";

describe("assertRelationInstanceIds", () => {
  test("does not throw when relation targets share the instance id", () => {
    const author = makeDummyItem({ file: "/author.json" });
    const primitives = [
      makeDummyCollection({
        directory: "/posts",
        extension: ".md",
        relations: { author },
      }),
    ];

    expect(() =>
      assertRelationInstanceIds(primitives, DUMMY_INSTANCE_ID),
    ).not.toThrow();
  });

  test("does not throw when a primitive has no relations", () => {
    const primitives = [
      makeDummyCollection({ directory: "/posts", extension: ".md" }),
    ];

    expect(() =>
      assertRelationInstanceIds(primitives, DUMMY_INSTANCE_ID),
    ).not.toThrow();
  });

  test("throws when a relation target has a different instance id", () => {
    const author = makeDummyItem({
      file: "/author.json",
      instanceId: Symbol.for("qino.tests.other"),
    });
    const primitives = [
      makeDummyCollection({
        directory: "/posts",
        extension: ".md",
        relations: { author },
      }),
    ];

    expect(() =>
      assertRelationInstanceIds(primitives, DUMMY_INSTANCE_ID),
    ).toThrow(/different createQino\(\) call/);
  });

  test("resolves lazy relation targets", () => {
    const author = makeDummyItem({
      file: "/author.json",
      instanceId: Symbol.for("qino.tests.other"),
    });
    const primitives = [
      makeDummyCollection({
        directory: "/posts",
        extension: ".md",
        relations: { author: () => author },
      }),
    ];

    expect(() =>
      assertRelationInstanceIds(primitives, DUMMY_INSTANCE_ID),
    ).toThrow(/different createQino\(\) call/);
  });
});

test.each([false, true])(
  "validates tree target instance IDs (lazy: %s)",
  (lazy) => {
    for (const instanceId of [DUMMY_INSTANCE_ID, Symbol("other")]) {
      const tree = makeDummyTree({
        directory: "/docs",
        extension: ".md",
        instanceId,
      });
      const source = makeDummyTree({
        directory: "/source",
        extension: ".md",
        relations: { doc: lazy ? () => tree : tree },
      });
      const validate = () =>
        assertRelationInstanceIds([source], DUMMY_INSTANCE_ID);
      if (instanceId == DUMMY_INSTANCE_ID) expect(validate).not.toThrow();
      else expect(validate).toThrow(/different createQino\(\) call/);
    }
  },
);
