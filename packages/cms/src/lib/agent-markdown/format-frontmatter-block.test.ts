import { expect, test } from "vitest";

import { formatFrontmatterBlock } from "./format-frontmatter-block";

test("escapes DEL, the C1 controls, U+FFFE and U+FFFF, which JSON leaves raw and YAML parsers reject or read as a line break", () => {
  const block = formatFrontmatterBlock({
    title: "a\u007fb\u0085c\u009fd\u2028e\ufffef\uffffg",
    canonical: "https://example.com/",
  });

  expect(block).toBe(
    '---\ntitle: "a\\u007fb\\u0085c\\u009fd\u2028e\\ufffef\\uffffg"\ncanonical: "https://example.com/"\n---',
  );
});
