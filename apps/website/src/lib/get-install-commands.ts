export const packageManagers = ["pnpm", "npm", "bun", "yarn"] as const;
export type PackageManager = (typeof packageManagers)[number];

const skill = "skills add CharlyMartin/qino --skill set-up-qino-cms";

const commands = {
  pnpm: {
    install: "pnpm add @qino/cms zod",
    build: "pnpm qino build",
    skill: `pnpm dlx ${skill}`,
  },
  npm: {
    install: "npm install @qino/cms zod",
    build: "npx qino build",
    skill: `npx ${skill}`,
  },
  bun: {
    install: "bun add @qino/cms zod",
    build: "bunx qino build",
    skill: `bunx ${skill}`,
  },
  yarn: {
    install: "yarn add @qino/cms zod",
    build: "yarn qino build",
    skill: `yarn dlx ${skill}`,
  },
} satisfies Record<
  PackageManager,
  { install: string; build: string; skill: string }
>;

export type InstallCommand = keyof (typeof commands)[PackageManager];

export function getInstallCommands(packageManager: PackageManager) {
  return commands[packageManager];
}
