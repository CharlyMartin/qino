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

  test.each([
    ["12:34:56", "12:34:56"],
    ["1_000", "1_000"],
    ["no", "no"],
    ["yes", "yes"],
    ["on", "on"],
    ["off", "off"],
  ])(
    "keeps YAML 1.1-only scalar %s as a string (YAML 1.2 core)",
    (value, expected) => {
      expect(parseYaml(`value: ${value}`)).toEqual({ value: expected });
    },
  );

  test.each([
    ["true", true],
    ["false", false],
    ["~", null],
    ["017", 17],
    ["0x1F", 31],
    ["0o17", 15],
    ["1e3", 1000],
    [".inf", Number.POSITIVE_INFINITY],
  ])("resolves YAML 1.2 core scalar %s", (value, expected) => {
    expect(parseYaml(`value: ${value}`)).toEqual({ value: expected });
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

  test("rejects multi-document frontmatter", () => {
    expect(() => parseYaml("---\na: 1\n---\nb: 2")).toThrow(
      "YAML frontmatter must contain a single document",
    );
  });

  test("propagates malformed YAML errors", () => {
    expect(() => parseYaml("date: [2023-11-14")).toThrow();
  });
});
