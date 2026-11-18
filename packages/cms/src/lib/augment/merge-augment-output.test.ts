import { describe, expect, test } from "vitest";

import { mergeAugmentOutput } from "./merge-augment-output";

describe("mergeAugmentOutput", () => {
  const entry = {
    _meta: { filePath: "/content/posts/hello.md" },
    title: "Hello",
  };

  test("adds the output's fields to a copy of the entry", () => {
    const merged = mergeAugmentOutput(entry, { summary: "Hi" });

    expect(merged).toEqual({ ...entry, summary: "Hi" });
    expect(merged).not.toBe(entry);
  });

  test.each([
    ["an array", []],
    ["null", null],
    ["a string", "summary"],
    ["a function", () => ({})],
  ])("rejects %s", (_, output) => {
    expect(() => mergeAugmentOutput(entry, output)).toThrow(
      "/content/posts/hello.md: augment must return an object.",
    );
  });

  test("rejects fields the entry already has", () => {
    expect(() => mergeAugmentOutput(entry, { title: "Replacement" })).toThrow(
      "/content/posts/hello.md: augment cannot add reserved or overwrite existing fields: title.",
    );
  });

  test.each(["markdown", "raw"])(
    "rejects %s on Markdown entries but allows it on JSON entries",
    (key) => {
      const markdown = { ...entry, markdown: "# Hello", raw: "# Hello" };
      expect(() => mergeAugmentOutput(markdown, { [key]: "derived" })).toThrow(
        `/content/posts/hello.md: augment cannot add reserved or overwrite existing fields: ${key}.`,
      );

      const json = { _meta: { filePath: "/content/posts/hello.json" } };
      expect(mergeAugmentOutput(json, { [key]: "derived" })).toEqual({
        ...json,
        [key]: "derived",
      });
    },
  );
});
