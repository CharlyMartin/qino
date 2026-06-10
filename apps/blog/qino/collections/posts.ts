import { z } from "zod";

import { qino } from "../";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z
  .object({
    title: z.string(),
    "created-on": z.string(),
    "updated-on": z.string(),
    categories: z.array(z.string()),
    image: z.string(),
    author: z.string(),
    body: z.string(),
  })
  .strict();

export const postCollection = qino.createCollection({
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
  },
});
