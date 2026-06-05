import z from "zod";

import { createCollection } from "../";

const CategorySchema = z
  .object({
    name: z.string(),
    description: z.string(),
  })
  .strict();

export const categoryCollection = createCollection({
  directory: "/categories",
  schema: CategorySchema,
  extension: ".json",
});
