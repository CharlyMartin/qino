import { z } from "zod";

import { cloudConfigSchema } from "./cloud-config";
import { collectionSchema } from "./collection";
import { itemSchema } from "./item";
import { treeSchema } from "./tree";

/**
 * `config.json` version 1. Published versions never change in a breaking
 * way: a breaking change adds a new version instead. Unknown keys are
 * stripped, so an optional field added later doesn't fail older parsers.
 */
export const configV1Schema = z.object({
  version: z.literal(1),
  config: z.object({
    contentFolder: z.string(),
    mediaFolder: z.string(),
  }),
  cloud: cloudConfigSchema,
  collections: z.record(z.string(), collectionSchema),
  items: z.record(z.string(), itemSchema),
  trees: z.record(z.string(), treeSchema),
});
