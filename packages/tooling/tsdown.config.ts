import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    frontmatter: "src/frontmatter/parse-frontmatter.ts",
    relations: "src/relations/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node22",
});
