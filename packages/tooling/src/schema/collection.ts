import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const collectionSchema = primitiveBaseSchema.extend({
  directory: z.string(),
  cloud: z.object({
    searchableBy: z.array(z.string()),
    sortableBy: z.array(z.string()),
    hiddenFields: z.array(z.string()),
    media: primitiveMediaSchema,
  }),
});
