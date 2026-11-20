/** `text` with each run of whitespace, line breaks included, as one space, trimmed. */
export function toOneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}
