import { MARKDOWN_MEDIA_KEY, QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { AnyPrimitive } from "../../types/utils";
import { assertInputPaths } from "./assert-input-paths";
import { assertMediaFields } from "./assert-media-fields";
import { getPrimitiveId } from "./get-primitive-id";
import { serializeBody } from "./serialize-body";
import { serializeJsonSchema } from "./serialize-json-schema";
import { serializeMedia } from "./serialize-media";
import { serializePrimitiveCloud } from "./serialize-primitive-cloud";
import { serializeRelations } from "./serialize-relations";

/**
 * Describes one primitive in `config.json`: location, extension, names
 * (`displayAs`, `displayEntryAs`, `titleField`), body, JSON Schema,
 * relations, media, and cloud config. `displayAs` defaults to the id, and a tree's
 * `displayEntryAs` to its `titleField`, so the cloud UI always gets them.
 * Function-valued config (views, augment, sort) is left out.
 */
export function serializePrimitive(primitive: AnyPrimitive) {
  const id = getPrimitiveId(primitive);
  const {
    schema: validator,
    relations,
    media,
  } = primitive[QinoPrimitiveMarker];
  const schema = serializeJsonSchema(validator, id);
  assertInputPaths(primitive, schema, id);
  assertMediaFields({
    fields: Object.keys(media).filter((path) => path != MARKDOWN_MEDIA_KEY),
    relationPaths: Object.keys(relations),
    jsonSchema: schema,
    primitiveId: id,
  });

  const shared = {
    body: serializeBody(primitive[QinoPrimitiveMarker].extension),
    schema,
    relations: serializeRelations(relations),
    media: serializeMedia(media, id),
    cloud: serializePrimitiveCloud(primitive, schema, id),
  };

  const primitiveCloud = primitive[QinoPrimitiveMarker].cloud;
  const displayAs = primitiveCloud?.displayAs ?? id;
  const displayEntryAs = primitiveCloud?.displayEntryAs;

  if (isItem(primitive)) {
    const { file, extension } = primitive[QinoPrimitiveMarker];
    return { file, extension, displayAs, ...shared };
  }

  if (isCollection(primitive)) {
    const { directory, extension } = primitive[QinoPrimitiveMarker];
    return {
      directory,
      extension,
      displayAs,
      ...(displayEntryAs != undefined && { displayEntryAs }),
      ...shared,
    };
  }

  const { directory, extension, titleField, orderFileName } =
    primitive[QinoPrimitiveMarker];
  return {
    directory,
    extension,
    displayAs,
    displayEntryAs: displayEntryAs ?? `{${titleField}}`,
    titleField,
    orderFileName,
    ...shared,
  };
}
