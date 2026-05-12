import { z } from "zod";
import { ConfigSchema } from "../runtime/config";
import { SUPPORTED_EXTENSIONS } from "../lib/globals";

export const ExtensionSchema = z.enum(SUPPORTED_EXTENSIONS);

const RelationSchema = z.object({
  field: z.string(),
  target: z.string(),
  targetKind: z.enum(["collection", "singleton"]),
  cardinality: z.enum(["one", "many"]),
});

const CollectionLockSchema = z.object({
  directory: z.string(),
  extension: ExtensionSchema,
  relations: z.array(RelationSchema),
});

const SingletonLockSchema = z.object({
  file: z.string(),
  extension: ExtensionSchema,
  relations: z.array(RelationSchema),
});

export const LockFileSchema = z.object({
  qinoVersion: z.string(),
  config: ConfigSchema,
  collections: z.record(z.string(), CollectionLockSchema),
  singletons: z.record(z.string(), SingletonLockSchema),
});

export type LockFile = z.infer<typeof LockFileSchema>;
