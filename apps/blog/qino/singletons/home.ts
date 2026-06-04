import { createSingleton } from "qino";
import z from "zod";

import { postCollection } from "../collections/posts";

const HomeSchema = z
  .object({
    title: z.string(),
    tagline: z.string(),
    "featured-posts": z.array(z.string()),
    body: z.string(),
  })
  .strict();

export const homeSingleton = createSingleton({
  file: "/pages/home.md",
  schema: HomeSchema,
  relations: {
    "featured-posts[*]": postCollection,
  },
});
