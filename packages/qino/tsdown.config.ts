import { readFileSync } from "node:fs";

import { defineConfig } from "tsdown";

const pkg = JSON.parse(readFileSync("./package.json", "utf8")) as {
  version: string;
};

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  define: {
    __QINO_VERSION__: JSON.stringify(pkg.version),
  },
});
