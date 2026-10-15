const TOKEN_PATTERN = /\{([^}]*)\}/g;

/**
 * The `{token}` names of a `saveAs` path template, in order:
 * `"posts/{name}-{hash}"` gives `["name", "hash"]`.
 */
export function getPathTokens(template: string) {
  return [...template.matchAll(TOKEN_PATTERN)].map(([, token]) => token ?? "");
}
