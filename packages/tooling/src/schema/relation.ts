import { z } from "zod";

/**
 * A field referencing entries of another primitive, by kind and id. `parse`
 * is `true` when the site reads its values with a `parse` callback, which
 * `config.json` can't hold: values may be in the site's own format, like
 * `"[[Jane Doe]]"`.
 */
export const relationSchema = z.object({
  path: z.string(),
  target: z.object({
    kind: z.enum(["collection", "item", "tree"]),
    id: z.string(),
  }),
  cardinality: z.enum(["one", "many"]),
  parse: z.literal(true).optional(),
});
