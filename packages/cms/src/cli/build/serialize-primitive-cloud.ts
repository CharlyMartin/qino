import { DEFAULT_MEDIA_SAVE_AS, QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { CloudConfig } from "../../types/cloud";
import type { AnyPrimitive } from "../../types/utils";
import { assertCloudFields } from "./assert-cloud-fields";
import { assertDisplayAs } from "./assert-display-as";
import { assertDisplayEntryAs } from "./assert-display-entry-as";
import { assertEntrySaveAs } from "./assert-entry-save-as";
import { assertMediaFields } from "./assert-media-fields";
import { assertMediaSaveAs } from "./assert-media-save-as";
import { serializeAcceptedMedia } from "./serialize-accepted-media";

/**
 * Describes a primitive's `cloud` in `config.json`, fully resolved so the
 * cloud UI doesn't reimplement defaults: `media.saveAs` defaults, lists
 * default to `[]`, and `media.accepted` falls back to `initQino`'s, left out
 * when neither sets it. Every primitive gets media and hidden fields;
 * collections and trees add search and `saveAs` (left out when unset), and
 * collections sort. `displayAs` and `displayEntryAs` are checked here but
 * written top-level by `serializePrimitive`.
 */
export function serializePrimitiveCloud(
  primitive: AnyPrimitive,
  globalCloud: CloudConfig,
  jsonSchema: Record<string, unknown>,
  primitiveId: string,
) {
  const { cloud = {}, relations } = primitive[QinoPrimitiveMarker];
  if (cloud.displayAs != undefined)
    assertDisplayAs(cloud.displayAs, primitiveId);
  if (cloud.displayEntryAs != undefined) {
    assertDisplayEntryAs(cloud.displayEntryAs, jsonSchema, primitiveId);
  }
  const mediaSaveAs = cloud.media?.saveAs ?? DEFAULT_MEDIA_SAVE_AS;
  assertMediaSaveAs(mediaSaveAs, primitiveId);
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
  const media = { saveAs: mediaSaveAs, fields, ...(accepted && { accepted }) };

  if (isItem(primitive)) {
    if (cloud.saveAs != undefined) {
      throw new Error(
        `saveAs of "${primitiveId}" names new entries, but an item is a single file.`,
      );
    }
    if (cloud.displayEntryAs != undefined) {
      throw new Error(
        `displayEntryAs of "${primitiveId}" labels entries, but an item is a single file. Name it with displayAs.`,
      );
    }
    assertCloudFields({ hiddenFields }, jsonSchema, primitiveId);
    return { hiddenFields, media };
  }

  const searchableBy = cloud.searchableBy ?? [];
  const { saveAs } = cloud;
  if (saveAs != undefined) assertEntrySaveAs(saveAs, jsonSchema, primitiveId);
  const entrySaveAs = saveAs != undefined && { saveAs };

  if (isCollection(primitive)) {
    const sortableBy = cloud.sortableBy ?? [];
    assertCloudFields(
      { searchableBy, sortableBy, hiddenFields },
      jsonSchema,
      primitiveId,
    );
    return { searchableBy, sortableBy, hiddenFields, ...entrySaveAs, media };
  }

  assertCloudFields({ searchableBy, hiddenFields }, jsonSchema, primitiveId);
  return { searchableBy, hiddenFields, ...entrySaveAs, media };
}
