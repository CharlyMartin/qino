#!/usr/bin/env node
import { consola } from "consola";

import { build } from "./build";
import { check } from "./check";
import { lint } from "./lint";
import { load } from "./load";

async function main() {
  const [command] = process.argv.slice(2);

  switch (command) {
    case "lint": {
      const loaded = await load();
      await lint(loaded);
      return;
    }
    case "check": {
      const loaded = await load();
      await check(loaded);
      return;
    }
    case "build": {
      const loaded = await load();
      await lint(loaded);
      await check(loaded);
      await build({ collections: loaded.collections, trees: loaded.trees });
      return;
    }
    default:
      consola.error(
        command
          ? `Unknown command: ${command}`
          : `Usage: qino <command>\n\nCommands:\n  lint     Validate config, paths, and relations (no content read)\n  check    Validate every content file against its schema\n  build    Run lint + check, then generate types`,
      );
      process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  consola.error(`Error: ${message}`);
  process.exit(1);
});
