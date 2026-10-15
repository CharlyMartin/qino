import type { Infer } from "@qino/cms";
import { getMarkdownStats } from "@qino/cms/utils";
import camelcaseKeys from "camelcase-keys";
import { z } from "zod";

import qino from "../";
import { authorCollection } from "./authors";
import { categoryCollection } from "./categories";

const PostSchema = z
  .object({
    title: z.string().min(1).max(120),
    "created-on": z.iso.datetime(),
    "updated-on": z.iso.datetime(),
    categories: z.array(z.string()).min(1),
    image: z.string(),
    author: z.string(),
  })
  .strict()
  .transform((post) => camelcaseKeys(post));

export const postCollection = qino.defineCollection({
  directory: "posts",
  schema: PostSchema,
  extension: ".md",
  relations: {
    author: authorCollection,
    "categories[*]": categoryCollection,
  },
  cloud: {
    searchableBy: ["title"],
    sortableBy: ["title", "created-on"],
    media: { saveAs: "posts/{name}-{hash}.{ext}", fields: ["image"] },
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
