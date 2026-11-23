import { describe, expect, test } from "vitest";

import { startsWithH1 } from "./starts-with-h1";

describe("startsWithH1", () => {
  test("finds an MDX body's H1 after its imports, with a {#id}", () => {
    // The import keeps the MDX parse, which `{#id}` would otherwise break.
    const body = 'import X from "x";\n\n# Title {#title}\n\nBody.\n';

    expect(startsWithH1(body, { mdx: true })).toBe(true);
  });

  test.each([
    ["<!-- note -->\n\n# Title\n", false],
    ["<!-- note -->\n\n# Title\n", true],
    ["{/* note */}\n\n# Title\n", true],
  ])("finds the H1 after a comment: %j (MDX: %s)", (body, mdx) => {
    expect(startsWithH1(body, { mdx })).toBe(true);
  });

  test.each([
    ["{intro}\n\n# Title\n", true],
    ["<!-- a --> Intro <!-- b -->\n\n# Title\n", false],
  ])("is false after a block that renders: %j (MDX: %s)", (body, mdx) => {
    expect(startsWithH1(body, { mdx })).toBe(false);
  });

  test.each(["## Section\n\nBody.\n", "Intro.\n\n# Title\n", ""])(
    "is false for a body opening otherwise: %j",
    (body) => {
      expect(startsWithH1(body, { mdx: false })).toBe(false);
    },
  );
});
