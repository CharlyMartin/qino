import { z } from "zod";

import qino from "./index";

export const authorCollection = qino.defineCollection({
  directory: "authors",
  extension: ".json",
  schema: z
    .object({
      name: z.string(),
      image: z.string(),
      company: z.string(),
      role: z.string(),
    })
    .strict(),
  media: {
    image: { accepted: "image/jpeg", maxSize: "50KB" },
  },
});
