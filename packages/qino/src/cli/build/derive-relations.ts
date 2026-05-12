import { JSON_PATH_ARRAY, QinoMeta } from "../../lib";
import type { AnyCollection, AnySingleton } from "../../types";

export type RelationLockEntry = {
  field: string;
  target: string;
  kind: "collection" | "singleton";
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
    const isSingleton = "file" in targetMeta;

    out.push({
      field,
      target: isSingleton ? targetMeta.file : targetMeta.directory,
      kind: isSingleton ? "singleton" : "collection",
      cardinality: field.includes(JSON_PATH_ARRAY) ? "many" : "one",
    });
  }

  return out;
}
