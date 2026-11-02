import camelcaseKeys from "camelcase-keys";
import { z } from "zod";

import { authorCollection } from "./authors";
import qino from "./index";

export const postCollection = qino.defineCollection({
  directory: "posts",
  extension: ".mdx",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      "published-on": z.iso.date(),
      author: z.string(),
    })
    .strict()
    .transform((post) => camelcaseKeys(post)),
  markdownStats: true,
  relations: {
    author: authorCollection,
  },
  views: (view) => ({
    default: view({
      resolveRelations: 1,
      sort: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
    }),
  }),
});
