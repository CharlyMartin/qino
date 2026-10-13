import { describe, expect, test } from "vitest";

import { parsePath } from "../../lib/relations/parse-path";
import { collectPathValues } from "./collect-path-values";

const value = {
  author: "ada",
  tags: ["a", "b"],
  meta: { editors: ["x", "y"] },
  related: [{ post: "p1" }, { post: "p2" }],
};

function collect(path: string) {
  return collectPathValues(value, parsePath(path));
}

describe("collectPathValues", () => {
  test("reads a key", () => {
    expect(collect("author")).toEqual(["ada"]);
  });

  test("flattens arrays", () => {
    expect(collect("tags[*]")).toEqual(["a", "b"]);
    expect(collect("meta.editors[*]")).toEqual(["x", "y"]);
    expect(collect("related[*].post")).toEqual(["p1", "p2"]);
  });

  test("yields nothing for missing keys or non-arrays", () => {
    expect(collect("missing")).toEqual([]);
    expect(collect("author[*]")).toEqual([]);
    expect(collect("meta.missing[*]")).toEqual([]);
  });
});
