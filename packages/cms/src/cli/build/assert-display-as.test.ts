import { describe, expect, test } from "vitest";

import { assertDisplayAs } from "./assert-display-as";

describe("assertDisplayAs", () => {
  test.each(["Blog posts", "Home page", "Docs / Guides"])(
    "accepts %s",
    (displayAs) => {
      expect(() => assertDisplayAs(displayAs, "posts")).not.toThrow();
    },
  );

  test.each(["", "  "])("rejects an empty name: %j", (displayAs) => {
    expect(() => assertDisplayAs(displayAs, "posts")).toThrow(
      `displayAs "${displayAs}" of "posts" is empty. Name the primitive, or leave it out.`,
    );
  });

  test("rejects tokens", () => {
    expect(() => assertDisplayAs("{title}", "posts")).toThrow(
      'displayAs "{title}" of "posts" names the primitive, so it takes no {field}. Label entries with displayEntryAs.',
    );
  });
});
