import { countGraphemes } from "./count-graphemes";
import { countWords } from "./count-words";
import { getMarkdownProse } from "./get-markdown-prose";

export type MarkdownStats = {
  wordCount: number;
  proseCharacterCount: number;
  sourceCharacterCount: number;
};

export function stats(body: string): MarkdownStats {
  const prose = getMarkdownProse(body);

  return {
    wordCount: countWords(prose),
    proseCharacterCount: countGraphemes(prose),
    sourceCharacterCount: countGraphemes(body),
  };
}
