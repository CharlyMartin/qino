import { parseInlineMarkdown } from "../../lib/parse-inline-markdown";
import { ExternalLink } from "../marketing/external-link";
import { InlineCode } from "../marketing/inline-code";

type InlineMarkdownProps = {
  markdown: string;
};

/** A line of Markdown with its code spans, bold text, and links. */
export function InlineMarkdown({ markdown }: InlineMarkdownProps) {
  return parseInlineMarkdown(markdown).map((segment, index) => {
    // Segments never move, so their position is a stable key.
    const key = `${index}-${segment.text}`;
    if (segment.type == "code") {
      return <InlineCode key={key}>{segment.text}</InlineCode>;
    }
    if (segment.type == "strong") {
      return (
        <strong key={key} className="font-semibold text-foreground-3">
          <InlineMarkdown markdown={segment.text} />
        </strong>
      );
    }
    if (segment.type == "link") {
      return (
        <ExternalLink key={key} href={segment.href}>
          <InlineMarkdown markdown={segment.text} />
        </ExternalLink>
      );
    }
    return segment.text;
  });
}
