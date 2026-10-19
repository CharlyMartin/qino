import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const treeSchema = primitiveBaseSchema.extend({
  directory: z.string(),
  titleField: z.string(),
  displayAs: z.string().optional(),
  displayEntryAs: z.string().optional(),
  orderFileName: z.string(),
  cloud: z.object({
    searchableBy: z.array(z.string()),
    hiddenFields: z.array(z.string()),
    saveAs: z.string().optional(),
    media: primitiveMediaSchema,
  }),
});
