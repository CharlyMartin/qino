import { toSlugTypeName } from "./to-slug-type-name";

/**
 * Resolves a unique TypeScript type name for a primitive's directory.
 *
 * Names come from `toSlugTypeName`, which is lossy: distinct directories can
 * collapse to the same name. Leaf singularization makes `/post` and `/posts`
 * both `PostSlug`; separator stripping makes `/a-b` and `/a/b` both `ABSlug`.
 * Such clashes get a numeric suffix before `Slug` (`PostSlug` -> `Post2Slug`)
 * until a free name is found. The chosen name is added to `usedNames` so
 * subsequent calls keep disambiguating.
 */
export function getCollisionFreeTypeName(
  directory: string,
  usedNames: Set<string>,
) {
  const base = toSlugTypeName(directory);

  let typeName = base;
  let increment = 2;

  while (usedNames.has(typeName)) {
    typeName = base.replace(/Slug$/, `${increment}Slug`);
    increment++;
  }

  usedNames.add(typeName);
  return typeName;
}
