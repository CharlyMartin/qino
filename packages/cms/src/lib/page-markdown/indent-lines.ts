/**
 * `text` with `prefix` before each line after the first. A blank line gets
 * the prefix's blockquote markers only, so it stays inside the quote.
 */
export function indentLines(text: string, prefix: string) {
  if (!prefix) return text;
  const blank = prefix.trimEnd();
  return text
    .split("\n")
    .map((line, index) => (index == 0 ? line : line ? prefix + line : blank))
    .join("\n");
}
