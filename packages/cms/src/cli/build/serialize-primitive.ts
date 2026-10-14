import { QinoPrimitiveMarker } from "../../data/globals";
import { isCollection } from "../../lib/guards/is-collection";
import { isItem } from "../../lib/guards/is-item";
import type { CloudConfig } from "../../types/cloud";
import type { AnyPrimitive } from "../../types/utils";
import { assertInputPaths } from "./assert-input-paths";
import { getPrimitiveId } from "./get-primitive-id";
import { serializeBody } from "./serialize-body";
import { serializeJsonSchema } from "./serialize-json-schema";
import { serializePrimitiveCloud } from "./serialize-primitive-cloud";
import { serializeRelations } from "./serialize-relations";

/**
 * Describes one primitive in `config.json`: location, extension, body,
 * JSON Schema, relations, and cloud config. Function-valued config (views,
 * augment, sort) is left out.
 */
export function serializePrimitive(
  primitive: AnyPrimitive,
  cloud: CloudConfig,
) {
  const id = getPrimitiveId(primitive);
  const schema = serializeJsonSchema(primitive[QinoPrimitiveMarker].schema, id);
  assertInputPaths(primitive, schema, id);

  const shared = {
    body: serializeBody(primitive[QinoPrimitiveMarker].extension),
    schema,
    relations: serializeRelations(primitive[QinoPrimitiveMarker].relations),
    cloud: serializePrimitiveCloud(primitive, cloud, schema, id),
  };

  if (isItem(primitive)) {
    const { file, extension } = primitive[QinoPrimitiveMarker];
    return { file, extension, ...shared };
  }

  if (isCollection(primitive)) {
    const { directory, extension } = primitive[QinoPrimitiveMarker];
    return { directory, extension, ...shared };
  }

  const { directory, extension, titleField, orderFileName } =
    primitive[QinoPrimitiveMarker];
  return { directory, extension, titleField, orderFileName, ...shared };
}
