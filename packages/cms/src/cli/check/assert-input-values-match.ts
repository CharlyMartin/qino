import nodePath from "node:path";
import { isDeepStrictEqual } from "node:util";

import { META_FIELD_NAME, QinoPrimitiveMarker } from "../../data/globals";
import type { AnyPrimitive } from "../../types/utils";
import { getMappedFields } from "../build/get-mapped-fields";
import { getPrimitiveId } from "../build/get-primitive-id";
import { collectPathValues } from "./collect-path-values";
import { readRawEntry } from "./read-raw-entry";
import { readValidatedEntries } from "./read-validated-entries";

/**
 * `config.json` points the cloud UI at relation fields and `titleField` on
 * disk, but they're declared against the schema's output. Fails when a
 * transform changes their value (e.g. maps another field onto them), by
 * comparing each entry's on-disk values with its validated ones.
 */
export async function assertInputValuesMatch(primitive: AnyPrimitive) {
  const marker = primitive[QinoPrimitiveMarker];
  const fields = getMappedFields(primitive);

  if (fields.length == 0) return;

  for (const entry of await readValidatedEntries(primitive)) {
    const { filePath } = entry[META_FIELD_NAME];
    const raw = await readRawEntry(marker.schema, filePath);

    for (const { label, segments } of fields) {
      const onDisk = collectPathValues(raw, segments);
      const validated = collectPathValues(entry, segments);

      if (!isDeepStrictEqual(onDisk, validated)) {
        throw new Error(
          `${label} of "${getPrimitiveId(primitive)}" has a different value on disk than after validation in "${nodePath.relative(process.cwd(), filePath)}". \`config.json\` describes files on disk: a schema transform must not change relation fields or titleField.`,
        );
      }
    }
  }
}
