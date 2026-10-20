import { z } from "zod";

/** `false`, or the review settings when review is on. */
const reviewSchema = z.union([
  z.literal(false),
  z.object({ bypassIfAdmin: z.boolean() }),
]);

/** `initQino`'s `cloud`, with defaults resolved. */
export const cloudConfigSchema = z.object({
  publish: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("open_pull_request"),
      reviewBeforePublish: reviewSchema,
      branchPrefix: z.string(),
    }),
    z.object({
      mode: z.literal("commit_to_default_branch"),
      reviewBeforePublish: reviewSchema,
    }),
  ]),
});
