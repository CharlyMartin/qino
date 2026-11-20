/**
 * `text` with up to `indent`'s length of spaces and tabs removed from each
 * line after the first: the reverse of `indentLines`.
 */
export function dedentLines(text: string, indent: string) {
  return indent
    ? text.replace(new RegExp(`\\n[ \\t]{1,${indent.length}}`, "g"), "\n")
    : text;
}
