import type { Slug } from "../../types/utils";

/** An entry page's path: `pattern` with its `{slug}` replaced, each segment URL-encoded. */
export function fillEntryPagePath(pattern: string, slug: Slug) {
  const encoded = slug.split("/").map(encodeURIComponent).join("/");
  return pattern.replace("{slug}", encoded);
}
