import { createCollection } from "qino";
import z from "zod";

const CategorySchema = z
  .object({
    name: z.string(),
    description: z.string(),
  })
  .strict();

export const categories = createCollection({
  path: "categories",
  schema: CategorySchema,
  extention: ".json",
});

export const { getAll: getAllCategories, getOne: getCategory } = categories;
