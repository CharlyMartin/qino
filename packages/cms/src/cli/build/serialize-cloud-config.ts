import { DEFAULT_BRANCH_PREFIX } from "../../data/globals";
import type { CloudConfig } from "../../types/cloud";
import { serializeAcceptedMedia } from "./serialize-accepted-media";

/**
 * Describes `initQino`'s `cloud` in `config.json`, with defaults filled in.
 * `media.accepted` is left out when unset: the cloud UI applies its own.
 */
export function serializeCloudConfig({ publish, media }: CloudConfig) {
  const { mode, reviewBeforePublish } = publish;

  return {
    publish:
      publish.mode == "open_pull_request"
        ? {
            mode,
            reviewBeforePublish,
            branchPrefix: publish.branchPrefix ?? DEFAULT_BRANCH_PREFIX,
          }
        : { mode, reviewBeforePublish },
    ...(media?.accepted && {
      media: { accepted: serializeAcceptedMedia(media.accepted, "initQino") },
    }),
  };
}
