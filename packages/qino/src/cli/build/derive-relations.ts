import { JSON_PATH_ARRAY, QinoMeta } from "../../data";
import type { AnyCollectionMeta, AnySingletonMeta } from "../../types";
import { isSingleton } from "../../utils/is-singleton";

export type RelationLockEntry = {
  field: string;
  target: string;
  kind: AnyCollectionMeta["is"] | AnySingletonMeta["is"];
  cardinality: "one" | "many";
};

export function deriveRelations(
  relations: AnyCollectionMeta["relations"] | AnySingletonMeta["relations"],
) {
  const out: Array<RelationLockEntry> = [];

  for (const [field, declaration] of Object.entries(relations)) {
    if (!declaration) continue;
    const target =
      typeof declaration == "function" ? declaration() : declaration;
    const targetMeta = target[QinoMeta];

    out.push({
      field,
      target: isSingleton(target) ? targetMeta.file : targetMeta.directory,
      kind: targetMeta.is,
      cardinality: field.includes(JSON_PATH_ARRAY) ? "many" : "one",
    });
  }

  return out;
}
