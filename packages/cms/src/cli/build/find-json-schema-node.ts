import type { Segment } from "../../lib/relations/parse-path";
import { findJsonSchemaNodes } from "./find-json-schema-nodes";

/**
 * The first node `findJsonSchemaNodes` finds at the end of a relation path,
 * unions included rather than their first branch, or `undefined` when the
 * path doesn't exist in the schema. Enough to check a path exists; use
 * `findJsonSchemaNodes` to check what every branch allows there.
 */
export function findJsonSchemaNode(
  root: Record<string, unknown>,
  segments: Array<Segment>,
) {
  return findJsonSchemaNodes(root, segments)[0];
}
