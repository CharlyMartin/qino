import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, beforeEach, expect, test } from "vitest";

const exec = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const jitiCli = path.join(packageRoot, "node_modules/jiti/lib/jiti-cli.mjs");
const cli = path.join(packageRoot, "src/cli/index.ts");

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-cli-paths-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

test.each([
  "local paths",
  "inherited paths",
  "ancestor tsconfig",
  "tsconfig without paths",
  "no tsconfig",
])(
  "lint, check and build support %s",
  async (scenario) => {
    const cwd = path.join(tmp, "app");
    const aliases = !["tsconfig without paths", "no tsconfig"].includes(
      scenario,
    );
    for (const directory of [
      "qino/collections",
      "src/schemas",
      "src/fields",
      "content/posts",
      "public",
      "node_modules/@qino",
    ]) {
      await fs.mkdir(path.join(cwd, directory), { recursive: true });
    }
    await fs.symlink(
      packageRoot,
      path.join(cwd, "node_modules/@qino/cms"),
      "junction",
    );
    await fs.symlink(
      path.join(packageRoot, "node_modules/zod"),
      path.join(cwd, "node_modules/zod"),
      "junction",
    );

    if (scenario == "local paths") {
      await fs.writeFile(
        path.join(tmp, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { paths: { "@/*": ["./missing/*"] } },
        }),
      );
      await fs.writeFile(
        path.join(cwd, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } },
        }),
      );
    } else if (scenario == "inherited paths") {
      await fs.mkdir(path.join(tmp, "config"));
      await fs.writeFile(
        path.join(tmp, "config/tsconfig.base.json"),
        JSON.stringify({
          compilerOptions: { baseUrl: "..", paths: { "@/*": ["./app/src/*"] } },
        }),
      );
      await fs.writeFile(
        path.join(cwd, "tsconfig.json"),
        JSON.stringify({ extends: "../config/tsconfig.base.json" }),
      );
    } else if (scenario == "ancestor tsconfig") {
      await fs.writeFile(
        path.join(tmp, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { paths: { "@/*": ["./app/src/*"] } },
        }),
      );
    } else if (scenario == "tsconfig without paths") {
      await fs.writeFile(path.join(cwd, "tsconfig.json"), "{}");
    }

    const files = {
      "package.json": JSON.stringify({ private: true, type: "module" }),
      "qino/index.ts": `
      import { initQino } from "@qino/cms";
      import { config } from "${aliases ? "@/config" : "../src/config"}";
      export default initQino(config);
    `,
      "src/config.ts": `
      export const config = { contentFolder: "content", media: { folder: "public" } };
    `,
      "qino/collections/posts.ts": `
      import qino from "../index";
      import { postSchema } from "${aliases ? "@/schemas/post" : "../../src/schemas/post"}";
      export const posts = qino.defineCollection({
        directory: "posts", extension: ".md", schema: postSchema,
      });
    `,
      "src/schemas/post.ts": `
      import { z } from "zod";
      import { title } from "${aliases ? "@/fields/title" : "../fields/title"}";
      export const postSchema = z.object({ title });
    `,
      "src/fields/title.ts": `
      import { z } from "zod";
      export const title = z.literal("Hello");
    `,
      "content/posts/hello.md": "---\ntitle: Hello\n---\n# Hello",
    };
    for (const [file, content] of Object.entries(files)) {
      await fs.writeFile(path.join(cwd, file), content);
    }

    for (const command of ["lint", "check", "build"]) {
      const { stdout, stderr } = await exec(
        process.execPath,
        [jitiCli, cli, command],
        {
          cwd,
          env: { ...process.env, CONSOLA_LEVEL: "3" },
        },
      );
      expect(stdout + stderr).toContain(`qino ${command} done!`);
    }

    const types = await fs.readFile(
      path.join(cwd, "qino/_generated/types.d.ts"),
      "utf8",
    );
    expect(types).toContain('export type PostSlug = "hello" | (string & {});');
    expect(types).toContain('"posts": PostSlug;');
  },
  20_000,
);
