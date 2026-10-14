import { z } from "zod";

import qino from "../";

const AuthorSchema = z
  .object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    title: z.string(),
    company: z.string(),
  })
  .strict();

export const authorCollection = qino.defineCollection({
  directory: "authors",
  schema: AuthorSchema,
  extension: ".json",
});
