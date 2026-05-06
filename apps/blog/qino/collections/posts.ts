import { createCollection } from "qino";
import z from "zod";

const PostSchema = z
  .object({
    title: z.string(),
    "created-on": z.string(),
    "updated-on": z.string(),
    categories: z.array(z.string()),
    image: z.string(),
    author: z.string(),
    markdown: z.string(),
  })
  .strict();

export const { getAll: getAllPosts, getOne: getPost } = createCollection({
  path: "posts",
  schema: PostSchema,
  extention: ".md",
});
