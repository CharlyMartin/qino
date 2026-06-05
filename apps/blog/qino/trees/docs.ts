import z from "zod";

import { createTree } from "../";

const DocsSchema = z
  .object({
    title: z.string(),
    body: z.string(),
  })
  .strict();

export const docsTree = createTree({
  directory: "/docs",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
});
