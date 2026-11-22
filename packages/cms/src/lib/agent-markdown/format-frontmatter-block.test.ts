import { expect, test } from "vitest";

import { formatFrontmatterBlock } from "./format-frontmatter-block";

test("escapes DEL and the C1 controls, which JSON leaves raw and YAML parsers reject or read as a line break", () => {
  const block = formatFrontmatterBlock({
    title: "a\u007fb\u0085c\u009fd\u2028e",
    canonical: "https://example.com/",
  });

  expect(block).toBe(
    '---\ntitle: "a\\u007fb\\u0085c\\u009fd\u2028e"\ncanonical: "https://example.com/"\n---',
  );
});
