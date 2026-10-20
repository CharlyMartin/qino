import nodePath from "node:path";

import pluralize from "pluralize";

import type { AnyPrimitive } from "../../types/utils";
import { findMediaViolations } from "./find-media-violations";

/** Fails when media files break their primitive's `media` rules. */
export async function assertMediaConstraints(
  primitives: Array<AnyPrimitive>,
  mediaFolder: string,
) {
  const violations = (
    await Promise.all(
      primitives.map((primitive) =>
        findMediaViolations(primitive, mediaFolder),
      ),
    )
  ).flat();

  if (violations.length) {
    const lines = violations.map(
      ({ file, location, url, reason }) =>
        `  - ${nodePath.relative(process.cwd(), file)} (${location}) → ${url} ${reason}`,
    );

    throw new Error(
      `${violations.length} ${pluralize("media file", violations.length)} ${violations.length == 1 ? "breaks its" : "break their"} media rules:\n${lines.join("\n")}`,
    );
  }
}
