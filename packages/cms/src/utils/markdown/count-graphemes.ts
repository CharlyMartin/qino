const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });
const NON_ASCII = /[\u0080-￿]/;

/**
 * Counts user-perceived characters. In ASCII, every character is one, except
 * `\r\n`, so ASCII text skips the segmenter.
 */
export function countGraphemes(value: string) {
  if (!NON_ASCII.test(value)) {
    let count = value.length;
    for (
      let index = value.indexOf("\r\n");
      index != -1;
      index = value.indexOf("\r\n", index + 2)
    ) {
      count--;
    }
    return count;
  }

  let count = 0;
  for (const _ of segmenter.segment(value)) count++;
  return count;
}
