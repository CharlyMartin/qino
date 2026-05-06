import { z } from "zod";
import { ConfigSchema } from "../runtime/create-config";

export const LockFileSchema = z.object({
  qinoVersion: z.string(),
  config: ConfigSchema,
});

export type LockFile = z.infer<typeof LockFileSchema>;
