import { jsonFileNameSchema, markdown } from "qino/utils";
import { z } from "zod";

import qino from "../";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z
  .object({
    title: z.string(),
    "created-on": z.string(),
    "updated-on": z.string(),
    categories: z.array(jsonFileNameSchema),
    image: z.string(),
    author: jsonFileNameSchema,
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
  augment: (post) => {
    const content = markdown.stats(post.body);
    return {
      ...content,
      readingMinutes: Math.ceil(content.wordCount / 220),
    };
  },
  resolveRelations: true,
});
