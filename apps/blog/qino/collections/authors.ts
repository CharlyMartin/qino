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

export const authors = createCollection({
  path: "authors",
  schema: AuthorSchema,
  extension: ".json",
});

export const { getAll: getAllAuthors, getOne: getAuthor } = authors;
