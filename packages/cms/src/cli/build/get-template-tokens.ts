const TOKEN_PATTERN = /\{([^}]*)\}/g;

/**
 * The `{token}` names of a template (`saveEntryAs`, `displayEntryAs`,
 * `media.saveFileAs`), in order:
 * `"posts/{name}-{hash}"` gives `["name", "hash"]`.
 */
export function getTemplateTokens(template: string) {
  return [...template.matchAll(TOKEN_PATTERN)].map(([, token]) => token ?? "");
}
