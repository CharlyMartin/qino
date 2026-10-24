import type { Infer } from "@qino/cms";
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
    category: z.string(),
    image: z.string(),
    author: z.string(),
  })
  .strict()
  .transform((post) => camelcaseKeys(post));

export const postCollection = qino.defineCollection({
  directory: "posts",
  schema: PostSchema,
  extension: ".md",
  markdownStats: true,
  relations: {
    author: authorCollection,
    category: categoryCollection,
  },
  media: {
    image: { accepted: "image/webp", maxSize: "5MB" },
    markdown: [
      { accepted: "image/webp", maxSize: "500KB" },
      { accepted: "image/png", maxSize: "500KB" },
      { accepted: "image/jpeg", maxSize: "500KB" },
    ],
  },
  cloud: {
    saveEntryAs: "{title}",
    displayAs: "Blog posts",
    displayEntryAs: "{title}",
    searchableBy: ["title"],
    sortableBy: ["title", "created-on"],
    media: { saveFileAs: "posts/{field}/{name}-{hash}" },
  },
  views: (view) => ({
    default: view({ resolveRelations: 1 }),
  }),
});

type PostConfig = Infer<typeof postCollection>;
export type Post = PostConfig["output"];
