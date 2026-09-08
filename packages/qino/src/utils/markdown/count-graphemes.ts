const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });

export function countGraphemes(value: string) {
  return Array.from(segmenter.segment(value)).length;
}
