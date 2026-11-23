import { describe, expect, test } from "vitest";

import { absolutizeLinks } from "./absolutize-links";

const origin = "https://example.com";

describe("absolutizeLinks", () => {
  test("keeps a destination's escapes as written", () => {
    expect(absolutizeLinks("[a](/docs/a\\_b)", { origin, mdx: false })).toBe(
      "[a](https://example.com/docs/a\\_b)",
    );
  });

  test("reaches links inside MDX components, past imports", () => {
    const body =
      'import { Card } from "./card";\n\n<Card>\n  [the guide](/docs/guide)\n</Card>\n';

    expect(absolutizeLinks(body, { origin, mdx: true })).toBe(
      'import { Card } from "./card";\n\n<Card>\n  [the guide](https://example.com/docs/guide)\n</Card>\n',
    );
  });

  test("falls back to Markdown when the MDX doesn't parse", () => {
    const body = "<!-- a comment -->\n\n[the guide](/docs/guide)\n";

    expect(absolutizeLinks(body, { origin, mdx: true })).toBe(
      "<!-- a comment -->\n\n[the guide](https://example.com/docs/guide)\n",
    );
  });

  test("leaves a body without site-relative links unchanged", () => {
    const body = "Plain text, [elsewhere](https://other.com) and `/code`.\n";

    expect(absolutizeLinks(body, { origin, mdx: false })).toBe(body);
  });
});
