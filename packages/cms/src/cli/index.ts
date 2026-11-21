#!/usr/bin/env node
import { consola } from "consola";

import { build } from "./build/build";
import { isCi } from "./build/is-ci";
import { check } from "./check/check";
import { lint } from "./lint/lint";
import { load } from "./load/load";

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
      // In CI, a stale config.json fails instead of being rewritten.
      const isConfigFileChecked = isCi();
      await check(loaded, { checkConfigFileFreshness: isConfigFileChecked });
      await build(loaded, { isConfigFileChecked });
      consola.success(`qino ${BUILD} done!`);
      consola.log("");
      return;
    }
    default:
      consola.error(
        command
          ? `Unknown command: ${command}`
          : `Usage: qino <command>\n\nCommands:\n  ${LINT}     Validate config, paths, and relations (no content read)\n  ${CHECK}    Validate content against schemas and check local media exists\n  ${BUILD}    Run lint + check, then generate types, the image manifest, and, if enabled, config.json and the llms.txt files`,
      );
      process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  consola.error(`Error: ${message}`);
  process.exit(1);
});
