import { rendersNothing } from "../../lib/agent-markdown/renders-nothing";
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
  // Without the blocks that render nothing, such as comments.
  const shown = blocks.filter((node) => !rendersNothing(node));
  const h1Index = shown.findIndex(
    (node) => node.type == "heading" && node.depth == 1,
  );
  const h1 = shown[h1Index];
  const summary = shown[h1Index + 1];
  const end = (summary?.type == "blockquote" ? summary : h1)?.position?.end
    .offset;
  const head = h1 ? text.slice(h1.position?.start.offset, end) : "";
  return `${[head, ...documents.map((document) => document.trimEnd())].filter(Boolean).join("\n\n")}\n`;
}
