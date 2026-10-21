import { docsTree } from "../../qino/docs";
import { site } from "../lib/site";
import { getDocsMarkdown } from "./get-docs-markdown";

export async function getLlmsFullTxt() {
  const flat = await docsTree.getFlatTree();
  const pages = await Promise.all(
    flat.map(({ slug }) => getDocsMarkdown(slug)),
  );

  return [
    `# ${site.name} documentation`,
    `> ${site.description}`,
    ...pages,
  ].join("\n\n");
}
