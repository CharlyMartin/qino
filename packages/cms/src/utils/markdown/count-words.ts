const segmenter = new Intl.Segmenter("und", { granularity: "word" });

export function countWords(value: string) {
  let count = 0;
  for (const segment of segmenter.segment(value)) {
    if (segment.isWordLike) count++;
  }
  return count;
}
