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

export const homeSingleton = qino.createSingleton({
  file: "/pages/home.md",
  schema: HomeSchema,
  resolveRelations: true,
  relations: {
    "featured-posts[*]": postCollection,
  },
});
