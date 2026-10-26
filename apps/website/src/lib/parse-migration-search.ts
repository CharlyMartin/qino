import { z } from "zod";

// A strict shape, so a crafted link can't put arbitrary text on the page.
const searchSchema = z.object({
  repo: z
    .string()
    .max(100)
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional()
    .catch(undefined),
});

/** Reads `?repo=owner/name` to personalise the Contentlayer page. */
export function parseMigrationSearch(search: Record<string, unknown>) {
  return searchSchema.parse(search);
}
