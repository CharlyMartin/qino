/**
 * Resolves a local JSON Schema `$ref` (`#/$defs/Post`) against the root
 * schema. Returns `undefined` for remote refs or missing targets.
 */
export function resolveJsonSchemaRef(
  root: Record<string, unknown>,
  ref: string,
) {
  if (!ref.startsWith("#")) return undefined;

  return ref
    .slice(1)
    .split("/")
    .filter(Boolean)
    .map((part) =>
      decodeURIComponent(part).replaceAll("~1", "/").replaceAll("~0", "~"),
    )
    .reduce<unknown>(
      (node, part) =>
        typeof node == "object" && node != null
          ? (node as Record<string, unknown>)[part]
          : undefined,
      root,
    );
}
