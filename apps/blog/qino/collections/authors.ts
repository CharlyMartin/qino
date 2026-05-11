import { createCollection } from "qino";
import z from "zod";

const AuthorSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    title: z.string(),
    company: z.string(),
  })
  .strict();

export const authorCollection = createCollection({
  directory: "/authors",
  schema: AuthorSchema,
  extension: ".json",
});
