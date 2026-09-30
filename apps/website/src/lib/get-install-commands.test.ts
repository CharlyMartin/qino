import { expect, test } from "vitest";

import { getInstallCommands } from "./get-install-commands";

const skill = "skills add CharlyMartin/qino --skill set-up-qino-cms";

test.each([
  ["pnpm", "pnpm add @qino/cms zod", "pnpm qino build", `pnpm dlx ${skill}`],
  ["npm", "npm install @qino/cms zod", "npx qino build", `npx ${skill}`],
  ["bun", "bun add @qino/cms zod", "bunx qino build", `bunx ${skill}`],
  ["yarn", "yarn add @qino/cms zod", "yarn qino build", `yarn dlx ${skill}`],
] as const)(
  "provides runnable %s commands",
  (manager, install, build, skillCommand) => {
    expect(getInstallCommands(manager)).toEqual({
      install,
      build,
      skill: skillCommand,
    });
  },
);
