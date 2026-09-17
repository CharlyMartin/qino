import { describe, expect, test, vi } from "vitest";

import { buildViews } from "./build-views";
import { defineView } from "./define-view";

describe.each(["collection", "tree", "item"] as const)(
  "%s view construction",
  (primitive) => {
    test("allows omitted views and evaluates the factory once", () => {
      expect(buildViews(undefined, primitive)).toBeUndefined();
      const factory = vi.fn((view: (config: object) => object) => ({
        default: view({}),
        empty: view({}),
      }));
      expect(buildViews(factory, primitive)?.empty?.resolveRelations).toBe(
        false,
      );
      expect(factory).toHaveBeenCalledTimes(1);
    });

    test("rejects legacy object form with migration guidance", () => {
      expect(() => buildViews({ detail: {} }, primitive)).toThrow(
        /views: \(view\) =>/,
      );
    });

    test.each([undefined, null, [], Promise.resolve({})])(
      "rejects an invalid factory result %s",
      (result) => {
        expect(() => buildViews(() => result, primitive)).toThrow(
          /synchronously return an object/,
        );
      },
    );

    test("rejects unwrapped definitions, including default", () => {
      expect(() =>
        buildViews(
          () => ({ default: defineView({}, primitive), detail: {} }),
          primitive,
        ),
      ).toThrow('View "detail" must be created with view({ ... }).');
      expect(() => buildViews(() => ({ default: {} }), primitive)).toThrow(
        /View "default" must be created/,
      );
    });
  },
);

test.each(["tree", "item"] as const)(
  "%s rejects a collection helper result containing unsupported options",
  (primitive) => {
    for (const override of [
      { filter: () => true },
      { sort: () => 0 },
      { filter: null },
      { sort: null },
    ]) {
      const collectionView = { ...defineView({}, "collection"), ...override };
      expect(() =>
        buildViews(
          () => ({
            default: defineView({}, primitive),
            detail: collectionView,
          }),
          primitive,
        ),
      ).toThrow(/does not support filter or sort/);
    }
  },
);

test.each(["tree", "item"] as const)(
  "%s accepts spread undefined options in marked definitions",
  (primitive) => {
    const detail = {
      ...defineView({}, primitive),
      filter: undefined,
      sort: undefined,
    };
    expect(
      buildViews(() => ({ default: detail, detail }), primitive)?.detail,
    ).toBe(detail);
  },
);

test.each(["collection", "tree", "item"] as const)(
  "%s requires an own default view",
  (primitive) => {
    for (const result of [{}, { detail: defineView({}, primitive) }]) {
      expect(() => buildViews(() => result, primitive)).toThrow(
        /must return a "default" view/,
      );
    }
  },
);
