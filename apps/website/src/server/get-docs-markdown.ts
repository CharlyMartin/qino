import { docsTree } from "../../qino/docs";
import { toLlmMarkdown } from "../lib/to-llm-markdown";
import { getDocsLinks } from "./get-docs-links";

export async function getDocsMarkdown(slug: string) {
  const flat = await docsTree.getFlatTree();
  const node = flat.find((candidate) => candidate.slug == slug);
  if (!node) return null;

  const [entry, links] = await Promise.all([
    docsTree.getEntry(node.slug),
    getDocsLinks(node),
  ]);

  return toLlmMarkdown({ raw: entry.raw, links });
}
