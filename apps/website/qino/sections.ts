import { z } from "zod";

import qino from "./index";

export const sectionCollection = qino.defineCollection({
  directory: "sections",
  extension: ".mdx",
  schema: z
    .object({
      title: z.string(),
    })
    .strict(),
});
