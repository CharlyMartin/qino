/**
 * Turns a content directory into a prefix its files start with: `posts` ->
 * `posts/`. The content root (`""` or `"."`) becomes `""`, which every
 * content path starts with.
 */
export function toDirectoryPrefix(directory: string) {
  const trimmed = directory.replace(/\/+$/, "");
  if (trimmed == "" || trimmed == ".") return "";
  return `${trimmed}/`;
}
