import matter from "gray-matter";
import { describe, expect, test } from "vitest";

import { parseFrontmatter } from "./parse-frontmatter";
import { parseYaml } from "./parse-yaml";

const files = {
  "no frontmatter": "# Body\n",
  "empty file": "",
  frontmatter: "---\ntitle: Hello\n---\n# Body\n",
  "blank lines before the body": "---\ntitle: Hello\n---\n\n\n# Body",
  "no line break after the closing delimiter": "---\ntitle: Hello\n---# Body",
  "CRLF line endings": "---\r\ntitle: Hello\r\n---\r\n# Body\r\n",
  "a BOM": "﻿---\ntitle: Hello\n---\n# Body",
  "a BOM without frontmatter": "﻿# Body",
  "empty frontmatter": "---\n---\n# Body",
  "comment-only frontmatter": "---\n# draft\n  # notes\n---\n# Body",
  "unclosed frontmatter": "---\ntitle: Hello\n",
  "only an opening delimiter": "---",
  "a thematic break, not frontmatter": "----\ntitle: Hello\n----\n# Body",
  "frontmatter not at the start": "\n---\ntitle: Hello\n---\n# Body",
  "a yaml language": "---yaml\ntitle: Hello\n---\n# Body",
  "a yml language": "--- yml\ntitle: Hello\n---\n# Body",
  "an uppercase YAML language": "---YAML\ntitle: Hello\n---\n# Body",
  "spaces after the opening delimiter": "---   \ntitle: Hello\n---\n# Body",
  "--- inside the body": "---\ntitle: Hello\n---\n# Body\n\n---\n\nMore",
  "a closing line with more dashes": "---\ntitle: Hello\n-----\n# Body",
  "nested data": "---\ntags:\n  - a\n  - b\nseo:\n  title: Hi\n---\nBody",
};

describe("parseFrontmatter", () => {
  test.each(Object.entries(files))(
    "reads a file with %s as gray-matter does",
    (_, source) => {
      const expected = matter(source, { engines: { yaml: parseYaml } });
      expect(parseFrontmatter(source)).toEqual({
        data: expected.data,
        body: expected.content,
      });
    },
  );

  test("splits frontmatter from the body", () => {
    expect(parseFrontmatter("---\ntitle: Hello\n---\n# Body\n")).toEqual({
      data: { title: "Hello" },
      body: "# Body\n",
    });
  });

  test("keeps the body byte for byte after the closing line break", () => {
    const body = "\n  # Body  \r\n\n- item\n";
    expect(parseFrontmatter(`---\ntitle: Hello\n---\n${body}`).body).toBe(body);
  });

  test("reads YAML 1.2 core scalars, keeping dates as strings", () => {
    expect(
      parseFrontmatter("---\ndate: 2023-11-14\nok: no\n---\n").data,
    ).toEqual({ date: "2023-11-14", ok: "no" });
  });

  test.each(["json", "js", "javascript", "toml"])(
    "rejects ---%s frontmatter",
    (language) => {
      expect(() =>
        parseFrontmatter(`---${language}\n{ "title": "Hello" }\n---\n`),
      ).toThrow(`Frontmatter must be YAML: "---${language}" isn't supported.`);
    },
  );

  test("rejects non-mapping frontmatter", () => {
    expect(() => parseFrontmatter("---\nhello\n---\n# Body")).toThrow(
      "YAML frontmatter must be a mapping",
    );
  });

  test("propagates malformed YAML errors", () => {
    expect(() => parseFrontmatter("---\ntitle: [Hello\n---\n")).toThrow();
  });
});
