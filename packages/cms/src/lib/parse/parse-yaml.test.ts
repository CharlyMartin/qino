import { describe, expect, test } from "vitest";

import { parseYaml } from "./parse-yaml";

describe("parseYaml", () => {
  test.each([
    ["2023-11-14", "2023-11-14"],
    ['"2023-11-14"', "2023-11-14"],
    ["'2023-11-14'", "2023-11-14"],
    ["2023-11-14T12:34:56Z", "2023-11-14T12:34:56Z"],
    ["2023-11-14T12:34:56.123456+02:30", "2023-11-14T12:34:56.123456+02:30"],
    ["2023-11-14 12:34:56 -05:00", "2023-11-14 12:34:56 -05:00"],
  ])(
    "preserves untagged date or timestamp %s as a string",
    (value, expected) => {
      expect(parseYaml(`date: ${value}`)).toEqual({ date: expected });
    },
  );

  test.each(["2023-11-14", "2023-11-14T12:34:56+02:30"])(
    "honors an explicit !!timestamp tag for %s",
    (value) => {
      expect(parseYaml(`date: !!timestamp ${value}`)).toEqual({
        date: new Date(value),
      });
    },
  );

  test("preserves YAML 1.1 sexagesimal numbers", () => {
    expect(parseYaml('time: 12:34:56\nquoted: "12:34:56"')).toEqual({
      time: 45296,
      quoted: "12:34:56",
    });
  });

  test.each(["", "# comment", "null", "{}"])(
    "accepts empty frontmatter %j",
    (value) => {
      expect(parseYaml(value)).toEqual({});
    },
  );

  test.each(["hello", "42", "false", "[one, two]", "!!timestamp 2023-11-14"])(
    "rejects non-mapping frontmatter %s",
    (value) => {
      expect(() => parseYaml(value)).toThrow(
        "YAML frontmatter must be a mapping",
      );
    },
  );

  test("preserves dates inside objects and arrays", () => {
    expect(
      parseYaml(
        [
          "metadata:",
          "  published: 2023-11-14",
          "  revisions:",
          "    - 2023-11-15",
          "    - at: 2023-11-16T12:34:56Z",
        ].join("\n"),
      ),
    ).toEqual({
      metadata: {
        published: "2023-11-14",
        revisions: ["2023-11-15", { at: "2023-11-16T12:34:56Z" }],
      },
    });
  });

  test("preserves other YAML types, aliases, and merge keys", () => {
    const defaults = { count: 42, rating: 1.5, draft: false, summary: null };
    expect(
      parseYaml(
        [
          "defaults: &defaults",
          "  count: 42",
          "  rating: 1.5",
          "  draft: false",
          "  summary: null",
          "post:",
          "  <<: *defaults",
          "  date: 2023-11-14",
        ].join("\n"),
      ),
    ).toEqual({ defaults, post: { ...defaults, date: "2023-11-14" } });
  });

  test("propagates malformed YAML errors", () => {
    expect(() => parseYaml("date: [2023-11-14")).toThrow();
  });
});
