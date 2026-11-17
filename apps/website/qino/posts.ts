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
      "updated-on": z.iso.date().optional(),
      author: z.string(),
    })
    .strict()
    .transform((post) => camelcaseKeys(post)),
  markdown: { stats: true },
  relations: {
    author: authorCollection,
  },
  views: (view) => ({
    default: view({
      sort: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
    }),
    // Leaves `author` as a slug: the server bundle can't read its image with sharp.
    summary: view({
      resolveDepth: { author: 0 },
      sort: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
    }),
  }),
});
