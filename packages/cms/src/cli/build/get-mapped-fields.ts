import { QinoPrimitiveMarker } from "../../data/globals";
import { isTree } from "../../lib/guards/is-tree";
import { parsePath, type Segment } from "../../lib/relations/parse-path";
import type { AnyPrimitive } from "../../types/utils";

/**
 * Fields `config.json` points at on disk, though they're declared against the
 * schema's output: every relation path, plus `titleField` for trees.
 */
export function getMappedFields(primitive: AnyPrimitive) {
  const fields: Array<{ label: string; segments: Array<Segment> }> =
    Object.entries(primitive[QinoPrimitiveMarker].relations)
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
