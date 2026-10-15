import { z } from "zod";

import { acceptedMediaSchema } from "./accepted-media";

/** `initQino`'s `cloud`, with defaults resolved. */
export const cloudConfigSchema = z.object({
  publish: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("open_pull_request"),
      reviewBeforePublish: z.boolean(),
      branchPrefix: z.string(),
    }),
    z.object({
      mode: z.literal("commit_to_default_branch"),
      reviewBeforePublish: z.boolean(),
    }),
  ]),
  media: z.object({ accepted: acceptedMediaSchema }).optional(),
});
