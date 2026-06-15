import { pascalCase } from "es-toolkit";
import pluralize from "pluralize";

/**
 * Derives a readable type alias from a primitive's full directory path, e.g.
 * `/posts` -> `PostSlug`, `/docs/v1` -> `DocsV1Slug`. Every path segment is
 * PascalCased; only the **leaf** is singularized (so a parent like `docs`
 * stays plural). Using the full path keeps names unique across primitives.
 */

export function toSlugTypeName(directory: string) {
  const segments = directory.split("/").filter(Boolean);

  const name = segments
    .map((segment, index) => {
      const isLastSegement = index == segments.length - 1;
      return pascalCase(isLastSegement ? pluralize.singular(segment) : segment);
    })
    .join("");

  if (name == "") {
    throw new Error("name is empty and cannot be used to generate a slug name");
  }

  return `${name}Slug`;
}
