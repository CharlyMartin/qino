import { findLlmsTxtTemplateHead } from "./find-llms-txt-template-head";
import { parseLlmsTxtTemplate } from "./parse-llms-txt-template";

type BuildLlmsFullTxtParams = {
  /** The `llms.txt` template, as read. */
  template: string;
  /** The entry pages' agent Markdown, in order. */
  documents: Array<string>;
};

/**
 * `llms-full.txt`: the template's first H1 and the summary blockquote after
 * it, as written, then each document, a blank line apart. The result has LF
 * line endings and ends with one newline.
 */
export function buildLlmsFullTxt({
  template,
  documents,
}: BuildLlmsFullTxtParams) {
  const { text, blocks } = parseLlmsTxtTemplate(template);
  const { h1, summary } = findLlmsTxtTemplateHead(blocks);
  const end = (summary ?? h1)?.position?.end.offset;
  const head = h1 ? text.slice(h1.position?.start.offset, end) : "";
  return `${[head, ...documents.map((document) => document.trimEnd())].filter(Boolean).join("\n\n")}\n`;
}
