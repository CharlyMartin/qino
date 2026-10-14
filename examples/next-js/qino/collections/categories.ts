import { z } from "zod";

import qino from "../";

const CategorySchema = z
  .object({
    name: z.string().min(1).max(40),
    description: z.string(),
  })
  .strict();

export const categoryCollection = qino.defineCollection({
  directory: "categories",
  schema: CategorySchema,
  extension: ".json",
});
