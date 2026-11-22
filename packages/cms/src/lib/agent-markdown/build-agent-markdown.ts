import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { ComponentReplacement } from "../../types/agent-markdown";
import type { SupportedFileExtension } from "../../types/utils";
import { absolutizeLinks } from "./absolutize-links";
import { formatFrontmatterBlock } from "./format-frontmatter-block";
import { readEntryDescription } from "./read-entry-description";
import { type ReadEntryTitleParams, readEntryTitle } from "./read-entry-title";
import { replaceComponents } from "./replace-components";
import { startsWithH1 } from "./starts-with-h1";

type BuildAgentMarkdownParams<Entry> = ReadEntryTitleParams & {
  /** The entry file's extension: a `.json` entry has no body. */
  extension: SupportedFileExtension;
  /** The origin site-relative links resolve against, without a trailing `/`. */
  origin: string;
  /** Replaces an MDX body's components. */
  replacement?: ComponentReplacement<Entry>;
  /**
   * The page's URL. With one, the document opens with a frontmatter block,
   * which `llms-full.txt`'s documents leave out.
   */
  canonical?: string;
};

/**
 * An entry's agent Markdown, with LF line endings: a frontmatter block when
 * there's a `canonical`, then `# {title}`, `> {description}` when there is
 * one, then the body without frontmatter, its MDX components replaced.
 * Site-relative links are made absolute in both the description and the
 * body. A body that opens with its own H1, a replacement's included, keeps
 * its opening, without the heading or the description.
 */
export async function buildAgentMarkdown<Entry>({
  extension,
  origin,
  replacement,
  canonical,
  ...titleParams
}: BuildAgentMarkdownParams<Entry>) {
  const { entry } = titleParams;
  const mdx = extension == ".mdx";
  const rawBody = extension == ".json" ? undefined : entry[MARKDOWN_FIELD_NAME];
  let body = absolutizeLinks(
    typeof rawBody == "string" ? rawBody.replace(/\r\n?/g, "\n") : "",
    { origin, mdx },
  );
  if (mdx && replacement?.components) {
    body = await replaceComponents({ body, origin, ...replacement });
  }
  body = body.replace(/^(?:[ \t]*\n)+/, "");

  const title = readEntryTitle(titleParams);
  const description = readEntryDescription(entry, origin);
  const blocks = [];
  if (canonical) {
    blocks.push(formatFrontmatterBlock({ title, description, canonical }));
  }
  if (!startsWithH1(body, { mdx })) {
    blocks.push(`# ${title}`);
    if (description) {
      const lines = description.split("\n");
      blocks.push(lines.map((line) => (line ? `> ${line}` : ">")).join("\n"));
    }
  }
  if (body) blocks.push(body);

  return `${blocks.join("\n\n").trimEnd()}\n`;
}
