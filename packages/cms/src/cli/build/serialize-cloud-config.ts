import { DEFAULT_BRANCH_PREFIX } from "../../data/globals";
import type { CloudConfig } from "../../types/cloud";

/**
 * Describes `initQino`'s `cloud` in `config.json`, with defaults filled in.
 * `reviewBeforePublish` is `false`, or its settings when review is on, `true`
 * included.
 */
export function serializeCloudConfig({ publish }: CloudConfig) {
  const { mode } = publish;
  const review = publish.reviewBeforePublish;
  const reviewBeforePublish = review != false && {
    bypassIfAdmin: (typeof review == "object" && review.bypassIfAdmin) || false,
  };

  return {
    publish:
      publish.mode == "open_pull_request"
        ? {
            mode,
            reviewBeforePublish,
            branchPrefix: publish.branchPrefix ?? DEFAULT_BRANCH_PREFIX,
          }
        : { mode, reviewBeforePublish },
  };
}
