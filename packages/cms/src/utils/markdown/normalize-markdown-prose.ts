export function normalizeMarkdownProse(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}
