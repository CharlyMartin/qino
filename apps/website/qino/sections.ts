import { z } from "zod";

import qino from "./index";

export const sectionCollection = qino.defineCollection({
  directory: "sections",
  extension: ".mdx",
  schema: z
    .object({
      title: z.string(),
      signature: z
        .object({
          name: z.string(),
          title: z.string(),
          image: z.string(),
          url: z.url(),
        })
        .strict(),
    })
    .strict(),
});
