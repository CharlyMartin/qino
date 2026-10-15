import { z } from "zod";

import { acceptedMediaSchema } from "./accepted-media";

/** A primitive's media config, with defaults resolved. */
export const primitiveMediaSchema = z.object({
  saveAs: z.string(),
  accepted: acceptedMediaSchema.optional(),
});
