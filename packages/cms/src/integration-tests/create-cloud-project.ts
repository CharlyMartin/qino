import { createCliProject } from "./create-cli-project";

export const POST_SCHEMA_PATH = "src/schemas/post.ts";

/**
 * Writes a project with `cloud` set and a `posts` collection whose schema
 * lives outside `qino/`.
 */
export async function createCloudProject(cwd: string) {
  await createCliProject(cwd, {
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
  });
}
