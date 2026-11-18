import type { InlineSegment } from "../types/inline-segment";
import { isWebUrl } from "./is-web-url";

// Code spans first, so `**` or `[…](…)` inside one stays code, and bold text
// reads its code spans whole, so a `**` in one doesn't close it. A link's URL
// can hold balanced parentheses, as in `…/Foo_(bar)`.
const tokenPattern =
  /`([^`]+)`|\*\*((?:`[^`]+`|[^`])+?)\*\*|\[([^\]]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

/**
 * Splits a line of Markdown into text, code spans, bold text, and links. The
 * text of bold and link segments is Markdown itself, such as a code span.
 */
export function parseInlineMarkdown(markdown: string) {
  const segments: Array<InlineSegment> = [];
  let index = 0;
  for (const match of markdown.matchAll(tokenPattern)) {
    if (match.index > index) {
      segments.push({ type: "text", text: markdown.slice(index, match.index) });
    }
    const [token, code, strong, linkText, href] = match;
    index = match.index + token.length;
    if (code != null) {
      segments.push({ type: "code", text: code });
    } else if (strong != null) {
      segments.push({ type: "strong", text: strong });
    } else if (isWebUrl(href)) {
      segments.push({ type: "link", text: linkText, href });
    } else {
      // A relative or malformed link has nowhere to go, so keep its text.
      segments.push({ type: "text", text: linkText });
    }
  }
  if (index < markdown.length) {
    segments.push({ type: "text", text: markdown.slice(index) });
  }

  return segments;
}
