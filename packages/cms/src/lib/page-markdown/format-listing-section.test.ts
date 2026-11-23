import { describe, expect, test } from "vitest";

import { formatListingSection } from "./format-listing-section";

describe("formatListingSection", () => {
  test("titles the section, then lists its links", () => {
    expect(
      formatListingSection({
        title: "Guide",
        links: [
          {
            title: "Guide",
            url: "https://example.com/guide.md",
            description: "",
          },
          {
            title: "CLI",
            url: "https://example.com/cli.md",
            description: "Run it.",
          },
        ],
      }),
    ).toBe(
      "## Guide\n\n- [Guide](https://example.com/guide.md)\n- [CLI](https://example.com/cli.md): Run it.",
    );
  });
});
