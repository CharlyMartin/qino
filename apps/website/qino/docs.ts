import { z } from "zod";

import qino from "./index";

export const docsTree = qino.defineTree({
  directory: "docs",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      since: z.string().optional(),
    })
    .strict(),
  extension: ".mdx",
  titleField: "title",
  markdown: { toc: { upTo: "h3" } },
});
