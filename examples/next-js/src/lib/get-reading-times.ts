const WORDS_PER_MINUTE = 220;

export function getReadingTimes(wordCount: number) {
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
}
