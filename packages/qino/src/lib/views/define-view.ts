import { QinoViewMarker } from "../../data/globals";
import type { CollectionViewDefinition } from "../../types/collection-views";
import type { AnyPrimitiveMeta } from "../../types/utils";

type Config = Omit<
  CollectionViewDefinition,
  typeof QinoViewMarker | "resolveRelations"
> & {
  resolveRelations?: CollectionViewDefinition["resolveRelations"];
};

export function defineView(config: Config, primitive: AnyPrimitiveMeta["is"]) {
  if (!config || typeof config != "object" || Array.isArray(config)) {
    throw new Error("view() requires a configuration object.");
  }

  if (
    primitive != "collection" &&
    (typeof config.filter != "undefined" || typeof config.sort != "undefined")
  ) {
    throw new Error(`${primitive} views do not support filter or sort.`);
  }

  return {
    ...config,
    resolveRelations: config.resolveRelations ?? false,
    [QinoViewMarker]: true as const,
  };
}
