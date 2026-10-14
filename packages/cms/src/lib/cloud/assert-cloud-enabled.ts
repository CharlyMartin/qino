import type { QinoContext } from "../../runtime/qino/init-qino";

/**
 * A primitive's `cloud` config only ends up in `config.json` when `initQino`
 * sets `cloud`. Fails instead of silently ignoring it.
 */
export function assertCloudEnabled(
  ctx: QinoContext,
  cloud: object | undefined,
  primitiveId: string,
) {
  if (cloud && !ctx.cloud) {
    throw new Error(
      `"${primitiveId}" sets \`cloud\`, but initQino doesn't. Add \`cloud\` to initQino.`,
    );
  }
}
