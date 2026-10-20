import matter from "gray-matter";

import { isLocalMediaUrl } from "../../lib/media/is-local-media-url";
import { normalizeMediaUrl } from "../../lib/media/normalize-media-url";
import { parseYaml } from "../../lib/parse/parse-yaml";
import { collectStrings } from "./collect-strings";
import { scanMarkdownBody } from "./scan-markdown-body";

export function extractMediaLinks(raw: string, extension: string) {
  const isJson = extension == ".json";
  const parsed = isJson
    ? { data: JSON.parse(raw), content: "" }
    : matter(raw, { engines: { yaml: parseYaml } });

  // gray-matter's `content` is the source after the closing delimiter, so
  // data strings are only looked up before it, never in the body.
  const head = raw.slice(0, raw.length - parsed.content.length);
  const bodyLineOffset = head.split("\n").length - 1;

  const candidates = collectStrings(parsed.data).map((url) => ({
    url,
    line: head.slice(0, Math.max(head.indexOf(url), 0)).split("\n").length,
    image: false,
  }));

  if (!isJson) {
    // Blank lines stand in for frontmatter so every position the parser
    // reports, including those inside MDX error messages, is a file line.
    const body = "\n".repeat(bodyLineOffset) + parsed.content;

    try {
      candidates.push(...scanMarkdownBody(body, { mdx: extension == ".mdx" }));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const line = (cause as { line?: number } | null)?.line;
      throw new Error(line ? `line ${line}: ${message}` : message, { cause });
    }
  }

  const links = new Map<
    string,
    { url: string; line: number; image: boolean }
  >();

  for (const { url, line, image } of candidates) {
    if (!isLocalMediaUrl(url)) continue;

    const normalized = normalizeMediaUrl(url);
    const key = `${line}:${normalized}`;
    links.set(key, {
      url: normalized,
      line,
      image: image || (links.get(key)?.image ?? false),
    });
  }

  return [...links.values()].sort((a, b) => a.line - b.line);
}
