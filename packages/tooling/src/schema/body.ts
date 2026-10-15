import { z } from "zod";

/** An entry's body after the frontmatter, `null` for JSON files. */
export const bodySchema = z
  .object({ format: z.enum(["markdown", "mdx"]) })
  .nullable();
