import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { ComponentReplacement } from "../../types/agent-markdown";
import type { SupportedFileExtension } from "../../types/utils";
import { absolutizeLinks } from "./absolutize-links";
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
};

/**
 * An entry's agent Markdown, with LF line endings: `# {title}`,
 * `> {description}` when there is one, then the body without frontmatter, its
 * MDX components replaced. Site-relative links are made absolute in both the
 * description and the body. A body
 * that opens with its own H1, a replacement's included, keeps its opening,
 * without either.
 */
export async function buildAgentMarkdown<Entry>({
  extension,
  origin,
  replacement,
  ...title
}: BuildAgentMarkdownParams<Entry>) {
  const { entry } = title;
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

  const blocks = [];
  if (!startsWithH1(body, { mdx })) {
    blocks.push(`# ${readEntryTitle(title)}`);
    const description = readEntryDescription(entry, origin);
    if (description) {
      const lines = description.split("\n");
      blocks.push(lines.map((line) => (line ? `> ${line}` : ">")).join("\n"));
    }
  }
  if (body) blocks.push(body);

  return `${blocks.join("\n\n").trimEnd()}\n`;
}
