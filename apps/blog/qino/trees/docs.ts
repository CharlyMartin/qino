import { createTree } from "qino";
import z from "zod";

const DocsSchema = z
  .object({
    title: z.string(),
    markdown: z.string(),
  })
  .strict();

export const docsTree = createTree({
  directory: "/docs",
  schema: DocsSchema,
  extension: ".md",
  titleField: "title",
});
