import { z } from "zod";

import qino from "./index";
import { releaseCollection } from "./releases";

export const docsTree = qino.defineTree({
  directory: "/docs",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      since: z.string().optional(),
    })
    .strict(),
  extension: ".mdx",
  titleField: "title",
  relations: {
    since: releaseCollection,
  },
  views: (view) => ({
    default: view({ resolveRelations: 1 }),
  }),
});
