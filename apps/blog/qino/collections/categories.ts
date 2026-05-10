import { createCollection } from "qino";
import z from "zod";

const CategorySchema = z
  .object({
    name: z.string(),
    description: z.string(),
  })
  .strict();

export const categoryCollection = createCollection({
  relativePath: "/categories",
  schema: CategorySchema,
  extension: ".json",
});
