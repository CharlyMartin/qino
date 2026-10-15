import { z } from "zod";

/** File types editors can upload, with `maxSize` in bytes. */
export const acceptedMediaSchema = z.array(
  z.object({
    type: z.string(),
    maxSize: z.int().positive(),
  }),
);
