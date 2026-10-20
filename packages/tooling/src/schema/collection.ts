import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const collectionSchema = primitiveBaseSchema.extend({
  directory: z.string(),
  displayAs: z.string().optional(),
  displayEntryAs: z.string().optional(),
  cloud: z.object({
    searchableBy: z.array(z.string()),
    sortableBy: z.array(z.string()),
    hiddenFields: z.array(z.string()),
    saveEntryAs: z.string().optional(),
    media: primitiveMediaSchema,
  }),
});
