import { JSON_PATH_ARRAY, QinoMeta } from "../../data";
import type { AnyCollection, AnySingleton } from "../../types";
import { isSingleton } from "../../utils/is-singleton";

export type RelationLockEntry = {
  field: string;
  target: string;
  kind:
    | AnyCollection[typeof QinoMeta]["is"]
    | AnySingleton[typeof QinoMeta]["is"];
  cardinality: "one" | "many";
};

export function deriveRelations(
  relations:
    | AnyCollection[typeof QinoMeta]["relations"]
    | AnySingleton[typeof QinoMeta]["relations"],
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
