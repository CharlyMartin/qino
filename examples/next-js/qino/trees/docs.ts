import z from "zod";

import qino from "../";

const DocsSchema = z
  .object({
    title: z.string(),
    body: z.string(),
  })
  .strict();

export const docsTreeV1 = qino.defineTree({
  directory: "/docs/v1",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
});

export const docsTree = qino.defineTree({
  directory: "/docs/v2",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
});
