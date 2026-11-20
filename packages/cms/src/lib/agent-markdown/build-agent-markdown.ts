import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { SupportedFileExtension } from "../../types/utils";
import { absolutizeLinks } from "./absolutize-links";
import { readEntryDescription } from "./read-entry-description";
import { type ReadEntryTitleParams, readEntryTitle } from "./read-entry-title";
import { startsWithH1 } from "./starts-with-h1";

type BuildAgentMarkdownParams = ReadEntryTitleParams & {
  /** The entry file's extension: a `.json` entry has no body. */
  extension: SupportedFileExtension;
  /** The origin site-relative links resolve against, without a trailing `/`. */
  origin: string;
};

/**
 * An entry's agent Markdown, with LF line endings: `# {title}`,
 * `> {description}` when there is one, then the body without frontmatter, its
 * site-relative links made absolute. A body that opens with its own H1 keeps
 * its opening, without either.
 */
export function buildAgentMarkdown({
  extension,
  origin,
  ...title
}: BuildAgentMarkdownParams) {
  const { entry } = title;
  const mdx = extension == ".mdx";
  const rawBody = extension == ".json" ? undefined : entry[MARKDOWN_FIELD_NAME];
  const body =
    typeof rawBody == "string"
      ? absolutizeLinks(
          rawBody.replace(/\r\n?/g, "\n").replace(/^(?:[ \t]*\n)+/, ""),
          { origin, mdx },
        )
      : "";

  const blocks = [];
  if (!startsWithH1(body, { mdx })) {
    blocks.push(`# ${readEntryTitle(title)}`);
    const description = readEntryDescription(entry);
    if (description) {
      const lines = description.split("\n");
      blocks.push(lines.map((line) => (line ? `> ${line}` : ">")).join("\n"));
    }
  }
  if (body) blocks.push(body);

  return `${blocks.join("\n\n").trimEnd()}\n`;
}
