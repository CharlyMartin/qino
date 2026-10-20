import { z } from "zod";

const mediaRuleSchema = z.object({
  accepted: z.string(),
  maxSize: z.int().positive(),
});

/**
 * A primitive's `media`, keyed by relation path (`"gallery[*]"`), with
 * `maxSize` in bytes. Each field accepts one MIME type. `markdown`, when set,
 * lists the rules body images must match one of, one type per rule.
 */
export const mediaSchema = z
  .object({ markdown: z.array(mediaRuleSchema).optional() })
  .catchall(mediaRuleSchema);
