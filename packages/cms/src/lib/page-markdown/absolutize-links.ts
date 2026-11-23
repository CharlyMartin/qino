import { tokenizeMarkdownBody } from "../../utils/markdown/tokenize-markdown-body";

type AbsolutizeLinksOptions = {
  /** The origin site-relative links resolve against, without a trailing `/`. */
  origin: string;
  /** Parses the body as MDX, falling back to Markdown when it fails. */
  mdx: boolean;
};

// The raw destination of `[text](dest)`, `![alt](dest)` and `[label]: dest`,
// without the `<>` around it.
const DESTINATIONS = [
  "resourceDestinationString",
  "definitionDestinationString",
];

/**
 * Prefixes `origin` to every site-relative link, image and definition
 * destination, as written: escapes and titles stay, and so does the rest of
 * the body, code included.
 */
export function absolutizeLinks(
  body: string,
  { origin, mdx }: AbsolutizeLinksOptions,
) {
  // Every site-relative destination starts with `/`.
  if (!body.includes("/")) return body;

  const starts: Array<number> = [];
  for (const [kind, token] of tokenizeMarkdownBody(body, { mdx })) {
    if (kind != "enter" || !DESTINATIONS.includes(token.type)) continue;

    const destination = body.slice(token.start.offset, token.end.offset);
    if (destination.startsWith("/") && !destination.startsWith("//")) {
      starts.push(token.start.offset);
    }
  }

  let result = body;
  for (const start of starts.reverse()) {
    result = `${result.slice(0, start)}${origin}${result.slice(start)}`;
  }
  return result;
}
