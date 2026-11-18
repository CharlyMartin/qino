import { expect, test } from "vitest";

import { getFirstSentence } from "./get-first-sentence";

test("stops at the first sentence", () => {
  expect(
    getFirstSentence(
      "Caches parsed files for trees. A file is parsed again once it changes.",
    ),
  ).toBe("Caches parsed files for trees.");
});

test("stops before a sentence that opens with code", () => {
  expect(
    getFirstSentence(
      "Adds `getEntries` to trees. `getEntries` reads every entry.",
    ),
  ).toBe("Adds `getEntries` to trees.");
});

test("reads past abbreviations and periods in code", () => {
  expect(
    getFirstSentence(
      "Writes qino in lowercase, e.g. `cannot appear. In output`, in errors",
    ),
  ).toBe(
    "Writes qino in lowercase, e.g. `cannot appear. In output`, in errors",
  );
});

test("reads past periods inside words", () => {
  expect(getFirstSentence("Reads `config.json` on Node 22.1 too.")).toBe(
    "Reads `config.json` on Node 22.1 too.",
  );
});

test("reads past periods in links, parentheses, and bold text", () => {
  expect(
    getFirstSentence(
      "See [Migration notes. Start here](https://www.qino.works) (v2. Later) **Note. This**. Then more.",
    ),
  ).toBe(
    "See [Migration notes. Start here](https://www.qino.works) (v2. Later) **Note. This**.",
  );
});

test("stops at a sentence ending in bold text", () => {
  expect(
    getFirstSentence("**This is a breaking change.** Update your config."),
  ).toBe("**This is a breaking change.**");
});

test("turns a closing colon into a period", () => {
  expect(getFirstSentence("Adds two `cloud` options:")).toBe(
    "Adds two `cloud` options.",
  );
});
