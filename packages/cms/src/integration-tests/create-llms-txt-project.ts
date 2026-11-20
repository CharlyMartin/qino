import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));

type LlmsTxtProjectOptions = {
  /** The object `qino/index.ts` passes to `initQino`, as source. */
  config: string;
  /** Files to add or replace, by path. */
  files?: Record<string, string>;
};

/**
 * Writes a project with a docs tree, a posts collection whose default view
 * drops drafts, a notes collection, an about item, a snippets collection
 * without pages and an `llms.txt` template, linked to this package and its
 * zod.
 */
export async function createLlmsTxtProject(
  cwd: string,
  { config, files = {} }: LlmsTxtProjectOptions,
) {
  for (const directory of ["qino", "public", "node_modules/@qino"]) {
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

  const project = {
    "package.json": JSON.stringify({ private: true, type: "module" }),
    "qino/index.ts": `
      import { initQino } from "@qino/cms";
      export default initQino(${config});
    `,
    "qino/docs.ts": `
      import { z } from "zod";
      import qino from "./index";
      export const docs = qino.defineTree({
        directory: "docs", extension: ".mdx", titleField: "label",
        schema: z.object({ label: z.string(), description: z.string() }),
        pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
      });
    `,
    "qino/posts.ts": `
      import { z } from "zod";
      import qino from "./index";
      export const posts = qino.defineCollection({
        directory: "posts", extension: ".md",
        schema: z.object({
          title: z.string(), description: z.string().optional(), draft: z.boolean().optional(),
        }),
        pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
        views: (view) => ({ default: view({ filter: (post) => !post.draft }) }),
      });
    `,
    "qino/notes.ts": `
      import { z } from "zod";
      import qino from "./index";
      export const notes = qino.defineCollection({
        directory: "notes", extension: ".md", schema: z.object({ title: z.string() }),
        pages: { index: "/notes", entry: "/notes/{slug}", title: "Notes" },
      });
    `,
    "qino/about.ts": `
      import { z } from "zod";
      import qino from "./index";
      export const about = qino.defineItem({
        file: "about.md",
        schema: z.object({ title: z.string(), description: z.string() }),
        page: "/about",
      });
    `,
    "qino/snippets.ts": `
      import { z } from "zod";
      import qino from "./index";
      export const snippets = qino.defineCollection({
        directory: "snippets", extension: ".md", schema: z.object({}),
      });
    `,
    "content/docs/guide.mdx":
      "---\nlabel: Guide\ndescription: Start here.\n---\n",
    "content/docs/guide/cli.mdx":
      "---\nlabel: CLI\ndescription: Commands.\n---\n",
    "content/docs/api.mdx": "---\nlabel: API\ndescription: Reference.\n---\n",
    "content/posts/hello.md":
      "---\ntitle: Hello\ndescription: The first post.\n---\n",
    "content/posts/world.md": "---\ntitle: World\n---\n",
    "content/posts/draft.md": "---\ntitle: Draft\ndraft: true\n---\n",
    "content/notes/one.md": "---\ntitle: One\n---\n",
    "content/about.md": "---\ntitle: About\ndescription: Who we are.\n---\n",
    "content/snippets/cta.md": "Sign up.\n",
    "content/llms.md":
      "# Example\n\n> A site.\n\n## When to use\n\nAlways.\n\n## Optional\n\n- [GitHub](https://github.com/example): Source\n",
    ...files,
  };
  for (const [file, content] of Object.entries(project)) {
    await fs.mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await fs.writeFile(path.join(cwd, file), content);
  }
}
