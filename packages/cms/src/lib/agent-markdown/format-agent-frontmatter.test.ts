import { expect, test } from "vitest";

import { formatAgentFrontmatter } from "./format-agent-frontmatter";

test("escapes the characters JSON leaves raw that YAML parsers reject or read as line breaks", () => {
  const block = formatAgentFrontmatter({
    title: "a\u007fb\u0085c\u009fd\u2028e\u2029f\ufeffg",
    canonical: "https://example.com/",
  });

  expect(block).toBe(
    '---\ntitle: "a\\u007fb\\u0085c\\u009fd\\u2028e\\u2029f\\ufeffg"\ncanonical: "https://example.com/"\n---',
  );
});
