import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

export const POST_SCHEMA_PATH = "src/schemas/post.ts";

/**
 * Writes a project with `cloud` set and a `posts` collection whose schema
 * lives outside `qino/`, linked to this package and its zod.
 */
export async function createCloudProject(cwd: string) {
  for (const directory of [
    "qino/collections",
    "src/schemas",
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

  const files = {
    "package.json": JSON.stringify({ private: true, type: "module" }),
    "qino/index.ts": `
      import { initQino } from "@qino/cms";
      export default initQino({
        contentFolder: "content",
        mediaFolder: "public",
        cloud: {
          publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
        },
      });
    `,
    "qino/collections/posts.ts": `
      import qino from "../index";
      import { postSchema } from "../../src/schemas/post";
      export const posts = qino.defineCollection({
        directory: "posts", extension: ".md", schema: postSchema,
      });
    `,
    [POST_SCHEMA_PATH]: `
      import { z } from "zod";
      export const postSchema = z.object({ title: z.string() });
    `,
    "content/posts/hello.md": "---\ntitle: Hello\n---\n# Hello",
  };
  for (const [file, content] of Object.entries(files)) {
    await fs.writeFile(path.join(cwd, file), content);
  }
}
