/** An entry's `description`, trimmed and with LF line endings, or `""`. */
export function readEntryDescription(entry: Record<string, unknown>) {
  // YAML block scalars (`|`, `>`) end a description with a newline.
  return typeof entry.description == "string"
    ? entry.description.replace(/\r\n?/g, "\n").trim()
    : "";
}
