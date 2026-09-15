import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    cli: "src/cli/index.ts",
    utils: "src/utils/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node22",
});
