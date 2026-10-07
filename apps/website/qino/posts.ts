import { getMarkdownStats } from "@qino/cms/utils";
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
  views: (view) => ({
    default: view({
      augment: (post) => ({
        wordCount: getMarkdownStats(post.markdown).wordCount,
      }),
      sort: (a, b) => b.publishedOn.localeCompare(a.publishedOn),
    }),
  }),
});
