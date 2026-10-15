import { z } from "zod";

import { primitiveBaseSchema } from "./primitive-base";
import { primitiveMediaSchema } from "./primitive-media";

export const itemSchema = primitiveBaseSchema.extend({
  file: z.string(),
  cloud: z.object({ media: primitiveMediaSchema }),
});
