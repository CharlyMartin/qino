type FindPagePathErrorOptions = {
  /** Names the option in the message, such as `"pages.entry"`. */
  label: string;
  /** Whether the path takes `{slug}`, once. */
  takesSlug: boolean;
};

/** What's wrong with a `pages` path, or `undefined` when nothing is. */
export function findPagePathError(
  path: string,
  { label, takesSlug }: FindPagePathErrorOptions,
) {
  const name = `${label} "${path}"`;
  if (!path.startsWith("/")) return `${name} must start with "/".`;
  if (path != "/" && path.endsWith("/"))
    return `${name} must not end with "/".`;

  const tokens = path.match(/\{[^}]*\}/g) ?? [];
  if (!takesSlug)
    return tokens.length > 0 ? `${name} takes no token.` : undefined;

  const slugCount = tokens.filter((token) => token == "{slug}").length;
  if (slugCount != 1) return `${name} must contain {slug} once.`;
  if (tokens.length > 1) return `${name} takes no token but {slug}.`;
}
