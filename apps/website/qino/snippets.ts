import { z } from "zod";

import qino from "./index";

export const snippetCollection = qino.defineCollection({
  directory: "snippets",
  extension: ".md",
  schema: z
    .object({
      label: z.string(),
    })
    .strict(),
});
