import nodePath from "node:path";

import pluralize from "pluralize";

import type { QinoConfig } from "../../runtime/qino/init-qino";
import { findMissingMedia } from "./find-missing-media";

export async function assertMediaExists(params: QinoConfig) {
  const missing = await findMissingMedia(params);

  if (missing.length) {
    const lines = missing.map(
      ({ file, line, url }) =>
        `  - ${nodePath.relative(process.cwd(), file)}:${line} → ${url}`,
    );

    throw new Error(
      `${missing.length} missing ${pluralize("media file", missing.length)} in "${params.media.folder}":\n${lines.join("\n")}`,
    );
  }
}
