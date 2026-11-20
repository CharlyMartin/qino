import { parseFrontmatter } from "@qino/tooling/frontmatter";

/**
 * The `llms.txt` template without frontmatter or leading blank lines, with
 * LF line endings.
 */
export function cleanLlmsTxtTemplate(template: string) {
  return parseFrontmatter(template)
    .body.replace(/\r\n?/g, "\n")
    .replace(/^(?:[ \t]*\n)+/, "");
}
