import { expect, test } from "vitest";

import { indentLines } from "./indent-lines";

test("indents each line after the first, leaving blank lines blank", () => {
  expect(indentLines("a\nb\n\nc", "  ")).toBe("a\n  b\n\n  c");
});

test("keeps blank lines inside a blockquote", () => {
  expect(indentLines("a\n\nb", ">   ")).toBe("a\n>\n>   b");
});
