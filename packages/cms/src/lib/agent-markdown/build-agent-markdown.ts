import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { AgentMarkdownComponent } from "../../types/agent-markdown";
import type { SupportedFileExtension } from "../../types/utils";
import { absolutizeLinks } from "./absolutize-links";
import { readEntryDescription } from "./read-entry-description";
import { type ReadEntryTitleParams, readEntryTitle } from "./read-entry-title";
import { replaceComponents } from "./replace-components";
import { startsWithH1 } from "./starts-with-h1";

type BuildAgentMarkdownParams<Entry> = Omit<ReadEntryTitleParams, "entry"> & {
  /** The entry as read, before any view. */
  entry: Entry;
  /** The entry file's extension: a `.json` entry has no body. */
  extension: SupportedFileExtension;
  /** The origin site-relative links resolve against, without a trailing `/`. */
  origin: string;
  /** Replaces an MDX body's components, each function receiving `entry`. */
  components?: Readonly<Record<string, AgentMarkdownComponent<Entry>>>;
};

/**
 * An entry's agent Markdown, with LF line endings: `# {title}`,
 * `> {description}` when there is one, then the body without frontmatter, its
 * MDX components replaced and its site-relative links made absolute,
 * replacements' included. A body that opens with its own H1 keeps its
 * opening, without either.
 */
export async function buildAgentMarkdown<Entry>({
  entry,
  extension,
  origin,
  components,
  ...title
}: BuildAgentMarkdownParams<Entry>) {
  const fields = entry as Record<string, unknown>;
  const mdx = extension == ".mdx";
  const rawBody =
    extension == ".json" ? undefined : fields[MARKDOWN_FIELD_NAME];
  let body = typeof rawBody == "string" ? rawBody : "";
  if (mdx && components) {
    body = await replaceComponents({ body, components, entry });
  }
  body = absolutizeLinks(
    body.replace(/\r\n?/g, "\n").replace(/^(?:[ \t]*\n)+/, ""),
    { origin, mdx },
  );

  const blocks = [];
  if (!startsWithH1(body, { mdx })) {
    blocks.push(`# ${readEntryTitle({ ...title, entry: fields })}`);
    const description = readEntryDescription(fields);
    if (description) {
      const lines = description.split("\n");
      blocks.push(lines.map((line) => (line ? `> ${line}` : ">")).join("\n"));
    }
  }
  if (body) blocks.push(body);

  return `${blocks.join("\n\n").trimEnd()}\n`;
}
