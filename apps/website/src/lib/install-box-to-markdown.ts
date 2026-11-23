import type { PageMarkdownComponentContext } from "@qino/cms";

import {
  getInstallCommands,
  type InstallCommand,
} from "./get-install-commands";

const npmCommands = getInstallCommands("npm");

// `<InstallBox />` for agents: its npm command, `install` by default, in a
// shell block. An unknown command keeps the component as written.
export function installBoxToMarkdown({ props }: PageMarkdownComponentContext) {
  const { command = "install" } = props;
  if (typeof command != "string" || !Object.hasOwn(npmCommands, command)) {
    return null;
  }
  return `\`\`\`sh\n${npmCommands[command as InstallCommand]}\n\`\`\``;
}
