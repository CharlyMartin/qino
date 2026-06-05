#!/usr/bin/env node
import { runBuild } from "./build";

async function main() {
  const [command] = process.argv.slice(2);

  switch (command) {
    case "build":
      await runBuild();
      return;
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
