import { describe, expect, test } from "vitest";

import { getMarkdownProse } from "./get-markdown-prose";

describe("getMarkdownProse", () => {
  test("keeps text and leaves out code, components and expressions", () => {
    expect(
      getMarkdownProse(
        "# Hello\n\nRead `code` and <Callout>this</Callout> {name} now.\n",
      ),
    ).toBe("Hello Read and now.");
  });

  test("leaves out {#id}, which keeps the body parsing as MDX", () => {
    expect(
      getMarkdownProse("# Hello {#hello}\n\nRun <Callout>this</Callout> it.\n"),
    ).toBe("Hello Run it.");
  });
});
