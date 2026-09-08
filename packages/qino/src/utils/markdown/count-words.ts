const segmenter = new Intl.Segmenter("und", { granularity: "word" });

export function countWords(value: string) {
  return Array.from(segmenter.segment(value)).filter(
    (segment) => segment.isWordLike,
  ).length;
}
