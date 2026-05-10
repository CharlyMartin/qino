import { z } from "zod";
import { ConfigSchema } from "../runtime/create-config";

export const ExtensionSchema = z.enum([".md", ".mdx", ".json"]);

const RelationSchema = z.object({
  field: z.string(),
  target: z.string(),
  cardinality: z.enum(["one", "many"]),
});

const CollectionLockSchema = z.object({
  path: z.string(),
  extension: ExtensionSchema,
  relations: z.array(RelationSchema),
});

export const LockFileSchema = z.object({
  qinoVersion: z.string(),
  config: ConfigSchema,
  collections: z.record(z.string(), CollectionLockSchema),
});

export type LockFile = z.infer<typeof LockFileSchema>;
