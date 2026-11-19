import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { Slug } from "../../types/utils";
import { absolutizeLinks } from "./absolutize-links";
import { startsWithH1 } from "./starts-with-h1";

type BuildAgentMarkdownParams = {
  entry: Record<string, unknown>;
  slug: Slug;
  /** The origin site-relative links resolve against, without a trailing `/`. */
  origin: string;
  /** Parses the body as MDX, for `.mdx` files. */
  mdx: boolean;
};

/**
 * An entry's agent Markdown: `# {title}`, `> {description}` when there is one,
 * then the body without frontmatter, its site-relative links made absolute. A
 * body that opens with its own H1 keeps its opening, without either.
 */
export function buildAgentMarkdown({
  entry,
  slug,
  origin,
  mdx,
}: BuildAgentMarkdownParams) {
  const title = typeof entry.title == "string" ? entry.title : slug;
  const description =
    typeof entry.description == "string" ? entry.description : undefined;
  const rawBody = entry[MARKDOWN_FIELD_NAME];
  const body =
    typeof rawBody == "string"
      ? absolutizeLinks(rawBody.replace(/^(?:[ \t]*\n)+/, ""), { origin, mdx })
      : "";

  const blocks = startsWithH1(body, { mdx }) ? [] : [`# ${title}`];
  if (blocks.length > 0 && description) blocks.push(`> ${description}`);
  if (body) blocks.push(body);

  return `${blocks.join("\n\n").trimEnd()}\n`;
}
