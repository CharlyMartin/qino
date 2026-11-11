import { parseYaml } from "./parse-yaml";

const DELIMITER = "---";
const CLOSING_DELIMITER = `\n${DELIMITER}`;
const YAML_LANGUAGES = ["", "yaml", "yml"];

/**
 * Splits a Markdown or MDX file into its YAML frontmatter and its body, as
 * `qino build` reads it. Follows gray-matter's rules: a leading BOM is
 * dropped, the file must start with `---` (not `----`), the frontmatter ends
 * at the next line starting with `---`, and the body starts after that
 * line's line break. A language after the opening `---` must be YAML.
 */
export function parseFrontmatter(source: string) {
  const text = source.replace(/^﻿/, "");
  if (!text.startsWith(DELIMITER) || text.charAt(DELIMITER.length) == "-") {
    return { data: {}, body: text };
  }

  const rest = text.slice(DELIMITER.length);
  const lineEnd = rest.search(/\r?\n/);
  const language = (lineEnd == -1 ? rest : rest.slice(0, lineEnd)).trim();
  if (!YAML_LANGUAGES.includes(language.toLowerCase())) {
    throw new Error(
      `Frontmatter must be YAML: "---${language}" isn't supported.`,
    );
  }

  const block = lineEnd == -1 ? "" : rest.slice(lineEnd);
  const closeIndex = block.indexOf(CLOSING_DELIMITER);
  const yaml = closeIndex == -1 ? block : block.slice(0, closeIndex);
  const body =
    closeIndex == -1
      ? ""
      : block
          .slice(closeIndex + CLOSING_DELIMITER.length)
          .replace(/^\r?\n?/, "");

  // Whitespace and comment lines only: empty, without parsing.
  const isEmpty = yaml.replace(/^\s*#[^\n]+/gm, "").trim() == "";

  return { data: isEmpty ? {} : parseYaml(yaml), body };
}
