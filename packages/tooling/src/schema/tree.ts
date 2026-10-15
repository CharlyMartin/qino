import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const treeSchema = primitiveBaseSchema.extend({
  directory: z.string(),
  titleField: z.string(),
  orderFileName: z.string(),
  cloud: z.object({
    searchableBy: z.array(z.string()),
    media: primitiveMediaSchema,
  }),
});
