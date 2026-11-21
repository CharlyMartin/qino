import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

type ImageProjectFiles = {
  /** Images to write into `public/`, keyed by their URL without the leading `/`. */
  images: Record<string, Buffer>;
};

/**
 * Writes a project linked to this package and its zod: `posts` with a `cover`
 * image field and an `author` relation to `authors`, whose `avatar` is an image
 * field read through `parse` (`[[jane.png]]` → `/avatars/jane.png`).
 */
export async function createImageProject(
  cwd: string,
  { images }: ImageProjectFiles,
) {
  for (const directory of [
    "qino/collections",
    "content/posts",
    "content/authors",
    "public/avatars",
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
      export default initQino({ contentFolder: "content", mediaFolder: "public" });
    `,
    "qino/collections/authors.ts": `
      import { z } from "zod";
      import qino from "../index";
      export const authors = qino.defineCollection({
        directory: "authors", extension: ".json",
        schema: z.object({ name: z.string(), avatar: z.string() }),
        media: {
          avatar: {
            accepted: "image/png", maxSize: "1MB",
            parse: (value) => value.replace(/^\\[\\[(.+)\\]\\]$/u, "/avatars/$1"),
          },
        },
      });
    `,
    "qino/collections/posts.ts": `
      import { z } from "zod";
      import qino from "../index";
      import { authors } from "./authors";
      export const posts = qino.defineCollection({
        directory: "posts", extension: ".md",
        schema: z.object({ title: z.string(), cover: z.string(), author: z.string() }),
        relations: { author: authors },
        media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
        views: (view) => ({ default: view({}) }),
      });
    `,
    "content/authors/jane.json": JSON.stringify({
      name: "Jane",
      avatar: "[[jane.png]]",
    }),
    "content/posts/hello.md":
      "---\ntitle: Hello\ncover: /cover.webp\nauthor: authors/jane.json\n---\n\nBody",
  };
  for (const [file, content] of Object.entries(files)) {
    await fs.writeFile(path.join(cwd, file), content);
  }
  for (const [url, image] of Object.entries(images)) {
    await fs.writeFile(path.join(cwd, "public", url), image);
  }
}
