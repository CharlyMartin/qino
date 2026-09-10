import { describe, expect, test } from "vitest";

import { selectView } from "./select-view";

describe("selectView", () => {
  test("treats explicit undefined override fields as omitted, including spreads", () => {
    const omitted = {
      resolveRelations: undefined,
      filter: undefined,
      sort: undefined,
    };
    const defaults = {};
    const detail = {};
    expect(selectView(defaults, { detail }, { ...omitted })).toBe(defaults);
    expect(
      selectView(defaults, { detail }, { view: "detail", ...omitted }),
    ).toBe(detail);
  });

  test.each([
    "resolveRelations",
    "filter",
    "sort",
  ])("rejects non-undefined %s values", (key) => {
    for (const value of [null, false, 0, () => true]) {
      expect(() =>
        selectView({}, { detail: {} }, {
          view: "detail",
          [key]: value,
        } as never),
      ).toThrow(/supported/);
    }
  });

  test("uses the default only when view is omitted", () => {
    const defaults = { resolveRelations: false as const };
    const views = { detail: {} };
    expect(selectView(defaults, views)).toBe(defaults);
    expect(selectView(defaults, views, {})).toBe(defaults);
    expect(selectView(defaults, views, { view: "detail" })).toBe(views.detail);
  });

  test.each([
    "default",
    "missing",
    "toString",
    "__proto__",
    "",
  ])("rejects invalid view %s", (view) => {
    expect(() => selectView({}, { detail: {} }, { view })).toThrow(
      view == "default" ? /implicit/ : /Unknown view/,
    );
  });

  test("rejects legacy overrides even when a view is selected", () => {
    const options = { view: "detail", resolveRelations: false };
    expect(() => selectView({}, { detail: {} }, options as never)).toThrow(
      /no longer supported/,
    );
    expect(() =>
      selectView({}, undefined, { resolveRelations: true } as never),
    ).toThrow(/no longer supported/);
  });
});
