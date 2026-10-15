import { DEFAULT_MEDIA_SAVE_AS, QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { CloudConfig } from "../../types/cloud";
import type { AnyPrimitive } from "../../types/utils";
import { assertCloudFields } from "./assert-cloud-fields";
import { assertMediaFields } from "./assert-media-fields";
import { assertMediaSaveAs } from "./assert-media-save-as";
import { serializeAcceptedMedia } from "./serialize-accepted-media";

/**
 * Describes a primitive's `cloud` in `config.json`, fully resolved so the
 * cloud UI doesn't reimplement defaults: `media.saveAs` defaults, lists
 * default to `[]`, and `media.accepted` falls back to `initQino`'s, left out
 * when neither sets it. Every primitive gets media and hidden fields;
 * collections and trees add search, and collections sort.
 */
export function serializePrimitiveCloud(
  primitive: AnyPrimitive,
  globalCloud: CloudConfig,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const { cloud = {}, relations } = primitive[QinoPrimitiveMarker];
  const saveAs = cloud.media?.saveAs ?? DEFAULT_MEDIA_SAVE_AS;
  assertMediaSaveAs(saveAs, primitiveId);
  const fields = cloud.media?.fields ?? [];
  assertMediaFields({
    fields,
    relationPaths: Object.keys(relations),
    jsonSchema,
    primitiveId,
  });
  const hiddenFields = cloud.hiddenFields ?? [];

  const accepted = cloud.media?.accepted
    ? serializeAcceptedMedia(cloud.media.accepted, `"${primitiveId}"`)
    : globalCloud.media?.accepted &&
      serializeAcceptedMedia(globalCloud.media.accepted, "initQino");
  const media = { saveAs, fields, ...(accepted && { accepted }) };

  if (isItem(primitive)) {
    assertCloudFields({ hiddenFields }, jsonSchema, primitiveId);
    return { hiddenFields, media };
  }

  const searchableBy = cloud.searchableBy ?? [];

  if (isCollection(primitive)) {
    const sortableBy = cloud.sortableBy ?? [];
    assertCloudFields(
      { searchableBy, sortableBy, hiddenFields },
      jsonSchema,
      primitiveId,
    );
    return { searchableBy, sortableBy, hiddenFields, media };
  }

  assertCloudFields({ searchableBy, hiddenFields }, jsonSchema, primitiveId);
  return { searchableBy, hiddenFields, media };
}
