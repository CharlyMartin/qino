import { QinoViewMarker } from "../../data";
import type { CollectionViewDefinition } from "../../types/collection-views";
import type { AnyPrimitiveMeta } from "../../types/utils";
import { assertViewNames } from "./assert-view-names";
import { defineView } from "./define-view";

export function buildViews(
  factory: unknown,
  primitive: AnyPrimitiveMeta["is"],
) {
  if (typeof factory == "undefined") return undefined;
  if (typeof factory != "function") {
    throw new Error(
      "Configure views with views: (view) => ({ default: view({ ... }) }). Object-form views are no longer supported.",
    );
  }

  const views = factory((config: Parameters<typeof defineView>[0]) =>
    defineView(config, primitive),
  );

  if (
    !views ||
    typeof views != "object" ||
    Array.isArray(views) ||
    (Object.getPrototypeOf(views) != Object.prototype &&
      Object.getPrototypeOf(views) != null)
  ) {
    throw new Error(
      "The views factory must synchronously return an object of named views.",
    );
  }

  assertViewNames(views);

  for (const [name, config] of Object.entries(views)) {
    if (
      !config ||
      typeof config != "object" ||
      !(QinoViewMarker in config) ||
      config[QinoViewMarker] != true
    ) {
      throw new Error(`View "${name}" must be created with view({ ... }).`);
    }

    if (
      primitive != "collection" &&
      (("filter" in config && typeof config.filter != "undefined") ||
        ("sort" in config && typeof config.sort != "undefined"))
    ) {
      throw new Error(
        `${primitive} view "${name}" does not support filter or sort.`,
      );
    }
  }

  return views as Record<string, CollectionViewDefinition>;
}
