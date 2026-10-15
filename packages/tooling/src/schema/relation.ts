import { z } from "zod";

/** A field referencing entries of another primitive, by kind and id. */
export const relationSchema = z.object({
  path: z.string(),
  target: z.object({
    kind: z.enum(["collection", "item", "tree"]),
    id: z.string(),
  }),
  cardinality: z.enum(["one", "many"]),
});
