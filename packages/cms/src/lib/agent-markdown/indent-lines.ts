/** `text` with `indent` before each line after the first, blank lines left blank. */
export function indentLines(text: string, indent: string) {
  return indent ? text.replace(/\n(?=[^\n])/g, `\n${indent}`) : text;
}
