import type { AnyCollection } from "../../types";

export async function collectCollectionSlugs(collection: AnyCollection) {
  const entries = await collection.getAll({ resolveRelations: false });
  const slugs = entries.map((entry) => entry._meta.slug);
  return [...slugs].sort();
}
