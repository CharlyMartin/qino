export const packageManagers = ["pnpm", "npm", "bun", "yarn"] as const;
export type PackageManager = (typeof packageManagers)[number];

const commands = {
  pnpm: { install: "pnpm add @qino/cms zod", build: "pnpm qino build" },
  npm: { install: "npm install @qino/cms zod", build: "npx qino build" },
  bun: { install: "bun add @qino/cms zod", build: "bunx qino build" },
  yarn: { install: "yarn add @qino/cms zod", build: "yarn qino build" },
} satisfies Record<PackageManager, { install: string; build: string }>;

export function getInstallCommands(packageManager: PackageManager) {
  return commands[packageManager];
}
