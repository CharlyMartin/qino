import { z } from "zod";

export const mdxFileNameSchema = z
  .string()
  .regex(/\.mdx$/i, "File must have a .mdx extension")
  .refine(
    (value) => !value.startsWith("/"),
    "File name must not start with a slash",
  );
