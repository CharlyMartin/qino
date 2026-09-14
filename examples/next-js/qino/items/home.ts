import z from "zod";

import qino from "../";
import { postCollection } from "../collections/posts";

const HomeSchema = z
  .object({
    title: z.string(),
    tagline: z.string(),
    "featured-posts": z.array(z.string()),
    body: z.string(),
  })
  .strict();

export const homeItem = qino.defineItem({
  file: "/pages/home.md",
  schema: HomeSchema,
  relations: {
    "featured-posts[*]": postCollection,
  },
  views: (view) => ({
    default: view({ resolveRelations: true }),
  }),
});
