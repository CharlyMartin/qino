import { rendersNothing } from "../../lib/agent-markdown/renders-nothing";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { cleanLlmsTxtTemplate } from "./clean-llms-txt-template";

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
  const text = cleanLlmsTxtTemplate(template);
  // Parsed, so a `#` line inside a code block isn't taken for the H1, and
  // without the blocks that render nothing, such as comments.
  const blocks = parseMarkdownBody(text, {
    mdx: false,
    headingIds: true,
  }).children.filter((node) => !rendersNothing(node));
  const at = blocks.findIndex(
    (node) => node.type == "heading" && node.depth == 1,
  );
  const h1 = blocks[at];
  const summary = blocks[at + 1];
  const end = (summary?.type == "blockquote" ? summary : h1)?.position?.end
    .offset;
  const head = h1 ? text.slice(h1.position?.start.offset, end) : "";
  return `${[head, ...documents.map((document) => document.trimEnd())].filter(Boolean).join("\n\n")}\n`;
}
