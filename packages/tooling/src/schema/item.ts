import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const itemSchema = primitiveBaseSchema.extend({
  file: z.string(),
  displayAs: z.string().optional(),
  cloud: z.object({
    hiddenFields: z.array(z.string()),
    media: primitiveMediaSchema,
  }),
});
