import z from "zod";

import { createTree } from "../";

const DocsSchema = z
  .object({
    title: z.string(),
    body: z.string(),
  })
  .strict();

export const docsTreeV1 = createTree({
  directory: "/docs/v1",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
});

export const docsTree = createTree({
  directory: "/docs/v2",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
});
