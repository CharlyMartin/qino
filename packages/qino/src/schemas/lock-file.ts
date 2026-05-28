import { z } from "zod";

import { SUPPORTED_CONTENT_EXTENSIONS } from "../data";
import { ConfigSchema } from "../runtime";

export const ExtensionSchema = z.enum(SUPPORTED_CONTENT_EXTENSIONS);

const RelationSchema = z.object({
  field: z.string(),
  target: z.string(),
  kind: z.enum(["collection", "singleton"]),
  cardinality: z.enum(["one", "many"]),
});

const CollectionLockSchema = z.object({
  directory: z.string(),
  extension: ExtensionSchema,
  relations: z.array(RelationSchema),
});

const SingletonLockSchema = z.object({
  file: z.string(),
  relations: z.array(RelationSchema),
});

const TreeLockSchema = z.object({
  directory: z.string(),
  extension: ExtensionSchema,
  titleField: z.string(),
  relations: z.array(RelationSchema),
});

export const LockFileSchema = z.object({
  qinoVersion: z.string(),
  config: ConfigSchema,
  collections: z.record(z.string(), CollectionLockSchema),
  singletons: z.record(z.string(), SingletonLockSchema),
  trees: z.record(z.string(), TreeLockSchema),
});

export type LockFile = z.infer<typeof LockFileSchema>;
