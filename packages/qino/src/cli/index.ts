#!/usr/bin/env node
import { consola } from "consola";

import { build } from "./build";
import { check } from "./check";
import { lint } from "./lint";
import { load } from "./load";

const LINT = "lint";
const CHECK = "check";
const BUILD = "build";

async function main() {
  const [command] = process.argv.slice(2);

  switch (command) {
    case LINT: {
      consola.start(`qino ${LINT} starts`);
      const loaded = await load();
      await lint(loaded);
      consola.success(`qino ${LINT} done!`);
      consola.log("");
      return;
    }
    case CHECK: {
      consola.start(`qino ${CHECK} starts`);
      const loaded = await load();
      await check(loaded);
      consola.success(`qino ${CHECK} done!`);
      consola.log("");
      return;
    }
    case BUILD: {
      consola.start(`qino ${BUILD} starts`);
      const loaded = await load();
      await lint(loaded);
      await check(loaded);
      await build({ collections: loaded.collections, trees: loaded.trees });
      consola.success(`qino ${BUILD} done!`);
      consola.log("");
      return;
    }
    default:
      consola.error(
        command
          ? `Unknown command: ${command}`
          : `Usage: qino <command>\n\nCommands:\n  ${LINT}     Validate config, paths, and relations (no content read)\n  ${CHECK}    Validate every content file against its schema\n  ${BUILD}    Run lint + check, then generate types`,
      );
      process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  consola.error(`Error: ${message}`);
  process.exit(1);
});
