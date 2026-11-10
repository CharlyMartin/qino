import { MARKDOWN_FIELD_NAME, TOC_FIELD_NAME } from "../../data/globals";
import type {
  MarkdownHeadingLevel,
  MarkdownTocOption,
} from "../../types/markdown-toc";

type AddEntryTocParams<Entry> = {
  entry: Entry;
  markdownToc: MarkdownTocOption;
  extension: string;
};

/**
 * Adds `_toc` from the Markdown body when `markdownToc` is on. The Markdown
 * parsers are only imported then.
 */
export async function addEntryToc<Entry extends object>({
  entry,
  markdownToc,
  extension,
}: AddEntryTocParams<Entry>) {
  if (!markdownToc) return entry;

  const { getMarkdownToc } = await import(
    "../../utils/markdown/get-markdown-toc"
  );
  const body = (entry as Record<string, unknown>)[MARKDOWN_FIELD_NAME];
  const { upTo, slug } = typeof markdownToc == "object" ? markdownToc : {};

  return {
    ...entry,
    [TOC_FIELD_NAME]: getMarkdownToc({
      body: typeof body == "string" ? body : "",
      upTo: upTo && (Number(upTo.slice(1)) as MarkdownHeadingLevel),
      mdx: extension == ".mdx",
      slug,
    }),
  };
}
