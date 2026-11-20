/**
 * An index page's default title: the directory's last segment in sentence
 * case, so `"blog-posts"` gives `"Blog posts"`. Letters after the first keep
 * their case.
 */
export function titleFromDirectory(directory: string) {
  const name = (directory.split("/").at(-1) ?? "")
    .replace(/[-_\s]+/g, " ")
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
}
