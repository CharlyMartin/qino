// Periods that end an abbreviation, not a sentence.
const abbreviations = ["e.g.", "i.e."];

/**
 * The paragraph's first sentence: up to a `.`, `!` or `?` followed by a space,
 * outside code spans, links, parentheses, and bold text, so the cut never
 * splits inline Markdown. A colon closing it, which introduced a code block or
 * a list, becomes a period.
 */
export function getFirstSentence(paragraph: string) {
  let isInCode = false;
  let isInStrong = false;
  // Open brackets and parentheses, as around a link's text and URL.
  let depth = 0;
  let end = paragraph.length;
  for (let index = 0; index < paragraph.length; index++) {
    const char = paragraph[index];
    if (char == "`") isInCode = !isInCode;
    if (isInCode) continue;

    if (paragraph.startsWith("**", index)) {
      isInStrong = !isInStrong;
      index++;
      // A sentence can end in bold text, as in "**Breaking change.** Rename…".
      const isSentenceEnd =
        ".!?".includes(paragraph[index - 2]) && paragraph[index + 1] == " ";
      if (!isInStrong && depth == 0 && isSentenceEnd) {
        end = index + 1;
        break;
      }
      continue;
    }
    if ("[(".includes(char)) depth++;
    if ("])".includes(char) && depth > 0) depth--;
    if (isInStrong || depth > 0) continue;

    if (!".!?".includes(char) || paragraph[index + 1] != " ") continue;
    const sentence = paragraph.slice(0, index + 1);
    if (abbreviations.some((abbreviation) => sentence.endsWith(abbreviation))) {
      continue;
    }
    end = index + 1;
    break;
  }

  return paragraph.slice(0, end).trim().replace(/:$/, ".");
}
