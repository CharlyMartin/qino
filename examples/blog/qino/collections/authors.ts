import z from "zod";

import qino from "../";

const AuthorSchema = z
  .object({
    firstName: z.string(),
    lastName: z.string(),
    title: z.string(),
    company: z.string(),
  })
  .strict();

export const authorCollection = qino.createCollection({
  directory: "/authors",
  schema: AuthorSchema,
  extension: ".json",
});
