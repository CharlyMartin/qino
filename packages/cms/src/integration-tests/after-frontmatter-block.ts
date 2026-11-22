import { expect } from "vitest";

/**
 * Agent Markdown after its frontmatter block, which the "frontmatter blocks"
 * tests cover, for tests about the rest of the document. Fails when there's
 * no block.
 */
export function afterFrontmatterBlock(markdown: string | null) {
  const block = markdown?.match(/^---\n(?:[^\n]*\n)*?---\n\n/)?.[0];
  expect(block, "a frontmatter block").toBeDefined();
  return markdown?.slice(block?.length) ?? null;
}
