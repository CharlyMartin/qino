import nodePath from "node:path";

/**
 * An index page's default title: the directory's last segment in sentence
 * case, so `"blog-posts"` gives `"Blog posts"`. Letters after the first keep
 * their case.
 */
export function titleFromDirectory(directory: string) {
  // Normalized first, so `posts/` and `./posts` are named `posts`.
  const name = nodePath
    .basename(nodePath.normalize(directory))
    .replace(/[-_\s]+/g, " ")
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
