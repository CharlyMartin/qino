import type { DocsLink } from "../types/docs-link";
import {
  getInstallCommands,
  type InstallCommand,
} from "./get-install-commands";
import { site } from "./site";

type LlmMarkdownOptions = {
  raw: string;
  links: Array<DocsLink>;
};

// Turns an MDX docs file into plain Markdown: components become text, site links absolute.
export function toLlmMarkdown({ raw, links }: LlmMarkdownOptions) {
  const linkList = links
    .map(
      (link) =>
        `- [${link.title}](${site.url}/docs/${link.slug}.md): ${link.description}`,
    )
    .join("\n");

  const markdown = raw
    .replace(/<LinkGrid\s*\/>/g, linkList)
    .replace(
      /<InstallBox(?:\s+command="(\w+)")?\s*\/>/g,
      (_, command: InstallCommand = "install") =>
        `\`\`\`sh\n${getInstallCommands("npm")[command]}\n\`\`\``,
    )
    .replace(/\]\(\/(?!\/)/g, `](${site.url}/`)
    .trim();

  return `${markdown}\n`;
}
