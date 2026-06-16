#!/usr/bin/env node
import { build } from "./build";
import { lint } from "./lint";

async function main() {
  const [command] = process.argv.slice(2);

  switch (command) {
    case "lint":
      await lint();
      return;
    case "build": {
      const { collections, trees } = await lint();
      await build({ collections, trees });
      return;
    }
    default:
      console.error(
        command
          ? `Unknown command: ${command}`
          : `Usage: qino <command>\n\nCommands:\n  build    Validate config, schemas, paths, and relations`,
      );
      process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
