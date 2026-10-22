import camelcaseKeys from "camelcase-keys";
import { z } from "zod";

import qino from "./index";

export const postCollection = qino.defineCollection({
  directory: "posts",
  extension: ".mdx",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      "published-on": z.iso.date(),
    })
    .strict()
    .transform((post) => camelcaseKeys(post)),
  markdownStats: true,
  views: (view) => ({
    default: view({
      sort: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
    }),
  }),
});
