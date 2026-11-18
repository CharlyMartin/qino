import { describe, expect, test } from "vitest";

import { countGraphemes } from "./count-graphemes";

const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });

describe("countGraphemes", () => {
  test.each([
    "",
    "abc",
    "a\r\nb",
    "\r",
    "\n",
    "\r\r\n",
    "\n\r",
    "\r\n\r\n",
    "\r\n\n\r",
    "a\tb\u0000c\u007f",
    "é",
    "👩‍💻 at work",
    "é\r\n",
    "\r\né",
    "naïve\r\ncafé",
  ])("matches Intl.Segmenter for %j", (value) => {
    expect(countGraphemes(value)).toBe(
      Array.from(segmenter.segment(value)).length,
    );
  });

  test("matches Intl.Segmenter on every short mix of ASCII and line breaks", () => {
    const alphabet = ["a", "\r", "\n", "\t", "\u0000"];
    let values = [""];

    for (let length = 1; length <= 4; length++) {
      values = values.flatMap((value) =>
        alphabet.map((character) => value + character),
      );
      for (const value of values) {
        expect(countGraphemes(value)).toBe(
          Array.from(segmenter.segment(value)).length,
        );
      }
    }
  });
});
