/**
 * An `<input pattern>` for `owner/name` or a GitHub repo URL. Browsers anchor it and
 * compile it with the `v` flag, so `-` is escaped inside character classes.
 */
export const githubRepoPattern = String.raw`(?:(?:https?://)?(?:www\.)?github\.com/)?[\w.\-]+/[\w.\-]+/?`;
