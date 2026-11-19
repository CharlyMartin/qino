import { staysOnSite } from "./stays-on-site";

type DescribePagePathErrorOptions = {
  /** Names the option in the message, such as `"pages.entry"`. */
  label: string;
  /** Whether the path takes `{slug}`, once. */
  takesSlug: boolean;
};

const TOKEN = /\{[^}]*\}/g;

/** What's wrong with a `pages` path, or `undefined` when nothing is. */
export function describePagePathError(
  path: string,
  { label, takesSlug }: DescribePagePathErrorOptions,
) {
  const name = `${label} "${path}"`;
  if (!path.startsWith("/")) return `${name} must start with "/".`;
  // A slug stands in for each token, as when a link fills the path.
  if (!staysOnSite(path.replace(TOKEN, "slug"))) {
    return `${name} must stay on the site.`;
  }
  if (/[?#]/.test(path)) {
    return `${name} must be a path, without "?" or "#".`;
  }
  // URLs read `\` as `/` and drop tabs and line breaks, which would hide the
  // dot segments below.
  if (/[\\\t\n\r]/.test(path)) {
    return `${name} must not contain "\\", tabs or line breaks.`;
  }
  // URLs resolve them, `%2e` included, moving pages' Markdown URLs elsewhere
  // or onto one another.
  const segments = path
    .split("/")
    .map((segment) => segment.replace(/%2e/gi, "."));
  if (segments.some((segment) => segment == "." || segment == "..")) {
    return `${name} must not contain "." or ".." segments.`;
  }

  const tokens = path.match(TOKEN) ?? [];
  if (!takesSlug) {
    return tokens.length > 0 ? `${name} takes no token.` : undefined;
  }

  const slugCount = tokens.filter((token) => token == "{slug}").length;
  if (slugCount != 1) return `${name} must contain {slug} once.`;
  if (tokens.length > 1) return `${name} takes no token but {slug}.`;
}
