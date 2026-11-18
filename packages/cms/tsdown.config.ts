import { defineConfig } from "tsdown";

import { createLicensesPlugin } from "./build/create-licenses-plugin";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node22",
  // The markdown parser is bundled from devDependencies, so its licenses ship
  // with it.
  plugins: [createLicensesPlugin()],
});
