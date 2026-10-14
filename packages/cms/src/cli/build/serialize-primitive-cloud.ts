import { DEFAULT_MEDIA_SAVE_AS, QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { CloudConfig } from "../../types/cloud";
import type { AnyPrimitive } from "../../types/utils";
import { assertCloudFields } from "./assert-cloud-fields";
import { assertMediaSaveAs } from "./assert-media-save-as";
import { serializeAcceptedMedia } from "./serialize-accepted-media";

/**
 * Describes a primitive's `cloud` in `config.json`, fully resolved so the
 * cloud UI doesn't reimplement defaults: `media.saveAs` defaults, and
 * `media.accepted` falls back to `initQino`'s, left out when neither sets it.
 * Collections get search, sort, and media; trees search and media; items media.
 */
export function serializePrimitiveCloud(
  primitive: AnyPrimitive,
  globalCloud: CloudConfig,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const { cloud = {} } = primitive[QinoPrimitiveMarker];
  const saveAs = cloud.media?.saveAs ?? DEFAULT_MEDIA_SAVE_AS;
  assertMediaSaveAs(saveAs, primitiveId);

  const accepted = cloud.media?.accepted
    ? serializeAcceptedMedia(cloud.media.accepted, `"${primitiveId}"`)
    : globalCloud.media?.accepted &&
      serializeAcceptedMedia(globalCloud.media.accepted, "initQino");
  const media = { saveAs, ...(accepted && { accepted }) };

  if (isItem(primitive)) return { media };

  const searchableBy = cloud.searchableBy ?? [];

  if (isCollection(primitive)) {
    const sortableBy = cloud.sortableBy ?? [];
    assertCloudFields({ searchableBy, sortableBy }, jsonSchema, primitiveId);
    return { searchableBy, sortableBy, media };
  }

  assertCloudFields({ searchableBy }, jsonSchema, primitiveId);
  return { searchableBy, media };
}
