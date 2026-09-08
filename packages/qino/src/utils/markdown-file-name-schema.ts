import { z } from "zod";

export const markdownFileNameSchema = z
  .string()
  .regex(/\.(md|markdown)$/i, "File must have a .md or .markdown extension")
  .refine(
    (value) => !value.startsWith("/"),
    "File name must not start with a slash",
  );
