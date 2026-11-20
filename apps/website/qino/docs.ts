import { z } from "zod";

import {
  getInstallCommands,
  type InstallCommand,
} from "../src/lib/get-install-commands";
import qino from "./index";

const npmCommands = getInstallCommands("npm");

export const docsTree = qino.defineTree({
  directory: "docs",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      since: z.string().optional(),
    })
    .strict(),
  extension: ".mdx",
  titleField: "title",
  markdown: { toc: { upTo: "h3" } },
  pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
  agentMarkdown: {
    components: {
      InstallBox: ({ props }) => {
        const { command = "install" } = props;
        if (
          typeof command != "string" ||
          !Object.hasOwn(npmCommands, command)
        ) {
          return null;
        }
        return `\`\`\`sh\n${npmCommands[command as InstallCommand]}\n\`\`\``;
      },
      // The page's children, as the rendered grid shows them. Annotated, as it
      // reads `docsTree`, whose type it's part of.
      LinkGrid: async ({ entry }): Promise<string> => {
        const node = await docsTree.getTree(entry._meta.slug);
        const links = await Promise.all(
          node.children.map(async (child) => {
            const { description } = await docsTree.getEntry(child.slug);
            return `- [${child.title}](${docsTree.getMarkdownUrl(child.slug)}): ${description}`;
          }),
        );
        return links.join("\n");
      },
    },
  },
});
