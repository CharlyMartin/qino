import { z } from "zod";

import qino from "../";

const DocsSchema = z
  .object({
    title: z.string(),
  })
  .strict();

export const docsTreeV1 = qino.defineTree({
  directory: "docs/v1",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
  cloud: { saveEntryAs: "{title}" },
});

export const docsTree = qino.defineTree({
  directory: "docs/v2",
  schema: DocsSchema,
  extension: ".mdx",
  titleField: "title",
  pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
  cloud: { saveEntryAs: "{title}", searchableBy: ["title"] },
});
