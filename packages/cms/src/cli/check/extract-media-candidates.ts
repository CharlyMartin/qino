import { parseFrontmatter } from "@qino/tooling/frontmatter";

import { collectStrings } from "./collect-strings";
import { scanMarkdownBody } from "./scan-markdown-body";

/**
 * Lists every URL in a content file, as written: frontmatter strings, and
 * body links and images, with their line numbers.
 */
export function extractMediaCandidates(raw: string, extension: string) {
  const isJson = extension == ".json";
  const parsed = isJson
    ? { data: JSON.parse(raw), body: "" }
    : parseFrontmatter(raw);

  // `body` is the source after the closing delimiter, so data strings are
  // only looked up before it, never in the body.
  const head = raw.slice(0, raw.length - parsed.body.length);
  const bodyLineOffset = head.split("\n").length - 1;

  const candidates = collectStrings(parsed.data).map((url) => ({
    url,
    line: head.slice(0, Math.max(head.indexOf(url), 0)).split("\n").length,
    image: false,
  }));

  if (!isJson) {
    // Blank lines stand in for frontmatter so every position the parser
    // reports, including those inside MDX error messages, is a file line.
    const body = "\n".repeat(bodyLineOffset) + parsed.body;

    try {
      candidates.push(...scanMarkdownBody(body, { mdx: extension == ".mdx" }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const line = (cause as { line?: number } | null)?.line;
      throw new Error(line ? `line ${line}: ${message}` : message, { cause });
    }
  }

  return candidates;
}
