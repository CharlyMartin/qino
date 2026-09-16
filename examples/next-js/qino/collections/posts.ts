import type { Infer } from "@qino/cms";
import { getMarkdownStats } from "@qino/cms/utils";
import { z } from "zod";

import qino from "../";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z
  .object({
    markdown: z.string(),
    title: z.string(),
    "created-on": z.string(),
    "updated-on": z.string(),
    categories: z.array(z.string()),
    image: z.string(),
    author: z.string(),
  })
  .strict();

export const postCollection = qino.defineCollection({
  directory: "/posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
  },
  views: (view) => {
    const base = view({ resolveRelations: 1 });

    return {
      default: base,
      withReadingTime: view({
        ...base,
        augment: (post) => {
          const content = getMarkdownStats(post.markdown);
          return {
            ...content,
            readingMinutes: Math.ceil(content.wordCount / 220),
          };
        },
      }),
    };
  },
});

type PostConfig = Infer<typeof postCollection>;
export type Post = PostConfig["output"];
