// Full class names, so Tailwind sees each one.
const indents = ["pl-3", "pl-6", "pl-9", "pl-12", "pl-15", "pl-18"];

/** The left padding of a heading `level` steps below the top one. */
export function getTocIndent(level: number) {
  return indents[Math.min(level, indents.length - 1)];
}
