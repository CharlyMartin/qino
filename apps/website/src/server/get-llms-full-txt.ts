import { docsTree } from "../../qino/docs";
import { site } from "../lib/site";

export async function getLlmsFullTxt() {
  const flat = await docsTree.getFlatTree();
  const pages = await Promise.all(
    flat.map(({ slug }) => docsTree.getAgentMarkdown(slug)),
  );

  return [
    `# ${site.name} documentation`,
    `> ${site.description}`,
    ...pages,
  ].join("\n\n");
}
