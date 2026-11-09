import { describe, expect, test } from "vitest";

import { selectView } from "./select-view";

describe("selectView", () => {
  test("treats explicit undefined override fields as omitted, including spreads", () => {
    const omitted = {
      resolveDepth: undefined,
      filter: undefined,
      sort: undefined,
    };
    const defaults = {};
    const detail = {};
    expect(selectView({ default: defaults, detail }, { ...omitted })).toBe(
      defaults,
    );
    expect(
      selectView({ default: defaults, detail }, { view: "detail", ...omitted }),
    ).toBe(detail);
  });

  test.each(["resolveRelations", "resolveDepth", "filter", "sort"])(
    "rejects non-undefined %s values",
    (key) => {
      for (const value of [null, false, 0, () => true]) {
        expect(() =>
          selectView({ detail: {} }, {
            view: "detail",
            [key]: value,
          } as never),
        ).toThrow(/supported/);
      }
    },
  );

  test("uses the configured default when selection is omitted or explicit", () => {
    const views = { default: {}, detail: {} };
    expect(selectView(views)).toBe(views.default);
    expect(selectView(views, {})).toBe(views.default);
    expect(selectView(views, { view: undefined })).toBe(views.default);
    expect(selectView(views, { view: "default" })).toBe(views.default);
    expect(selectView(undefined)).toEqual({ resolveDepth: {} });
    expect(selectView(views, { view: "detail" })).toBe(views.detail);
  });

  test.each(["default", "missing", "toString", "__proto__", ""])(
    "rejects invalid view %s",
    (view) => {
      expect(() => selectView({ detail: {} }, { view })).toThrow(
        /Unknown view/,
      );
    },
  );

  test("rejects getter depths even when a view is selected", () => {
    const options = { view: "detail", resolveDepth: { author: 0 } };
    expect(() => selectView({ detail: {} }, options as never)).toThrow(
      /Configure resolveDepth in a view/,
    );
    expect(() =>
      selectView(undefined, { resolveRelations: true } as never),
    ).toThrow(/Getter resolveRelations is not supported/);
  });
});
