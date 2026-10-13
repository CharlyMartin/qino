import { QinoPrimitiveMarker } from "../../data/globals";
import { isTree } from "../../lib/guards/is-tree";
import { parsePath, type Segment } from "../../lib/relations/parse-path";
import type { AnyPrimitive } from "../../types/utils";

type Field = { label: string; segments: Array<Segment> };

/**
 * Fields `config.json` points at on disk, though they're declared against the
 * schema's output: every relation path, plus `titleField` for trees.
 */
export function getMappedFields(primitive: AnyPrimitive) {
  const { relations } = primitive[QinoPrimitiveMarker];

  const fields: Array<Field> = Object.entries(relations)
    .filter(([, decl]) => decl)
    .map(([path]) => ({
      label: `Relation "${path}"`,
      segments: parsePath(path),
    }));

  if (isTree(primitive)) {
    const { titleField } = primitive[QinoPrimitiveMarker];

    fields.push({
      label: `titleField "${titleField}"`,
      segments: [{ kind: "key", name: titleField }],
    });
  }

  return fields;
}
