import { z } from "zod";

export const jsonFileNameSchema = z
  .string()
  .regex(/\.json$/i, "File must have a .json extension")
  .refine(
    (value) => !value.startsWith("/"),
    "File name must not start with a slash",
  );
