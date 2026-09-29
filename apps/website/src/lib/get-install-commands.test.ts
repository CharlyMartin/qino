import { expect, test } from "vitest";

import { getInstallCommands } from "./get-install-commands";

test.each([
  ["pnpm", "pnpm add @qino/cms zod", "pnpm qino build"],
  ["npm", "npm install @qino/cms zod", "npx qino build"],
  ["bun", "bun add @qino/cms zod", "bunx qino build"],
  ["yarn", "yarn add @qino/cms zod", "yarn qino build"],
] as const)("provides runnable %s commands", (manager, install, build) => {
  expect(getInstallCommands(manager)).toEqual({ install, build });
});
