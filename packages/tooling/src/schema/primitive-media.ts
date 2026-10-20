import { z } from "zod";

/** A primitive's `cloud.media`, with defaults resolved. */
export const primitiveMediaSchema = z.object({
  saveFileAs: z.string(),
});
