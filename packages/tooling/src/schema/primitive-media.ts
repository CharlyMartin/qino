import { z } from "zod";

import { acceptedMediaSchema } from "./accepted-media";

/**
 * A primitive's media config, with defaults resolved. `fields` are relation
 * paths (`"gallery[*]"`) to fields edited with a media picker.
 */
export const primitiveMediaSchema = z.object({
  saveAs: z.string(),
  fields: z.array(z.string()),
  accepted: acceptedMediaSchema.optional(),
});
