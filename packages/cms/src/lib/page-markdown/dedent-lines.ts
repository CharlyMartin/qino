/**
 * `text` with as much of `prefix` as each line after the first starts with
 * removed: its blockquote markers, and up to as many spaces and tabs. The
 * reverse of `indentLines`.
 */
export function dedentLines(text: string, prefix: string) {
  if (!prefix) return text;
  return text
    .split("\n")
    .map((line, index) => {
      if (index == 0) return line;
      let length = 0;
      for (const char of prefix) {
        const next = line[length];
        if (char == ">" ? next != ">" : next != " " && next != "\t") break;
        length++;
      }
      return line.slice(length);
    })
    .join("\n");
}
