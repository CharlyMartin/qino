import { describe, expect, test } from "vitest";

import { selectView } from "./select-view";

describe("selectView", () => {
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
