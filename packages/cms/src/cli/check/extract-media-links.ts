import matter from "gray-matter";

import { parseYaml } from "../../lib/parse/parse-yaml";
import { collectStrings } from "./collect-strings";
import { isLocalMediaUrl } from "./is-local-media-url";
import { normalizeMediaUrl } from "./normalize-media-url";
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
  }));

  if (!isJson) {
    try {
      for (const { url, line } of scanMarkdownBody(parsed.content, {
        mdx: extension == ".mdx",
      })) {
        candidates.push({ url, line: line + bodyLineOffset });
      }
    } catch (cause) {
      // MDX parse errors carry a body-relative `line`; report the file line.
      const message = cause instanceof Error ? cause.message : String(cause);
      const line = (cause as { line?: number } | null)?.line;
      throw new Error(
        line ? `line ${line + bodyLineOffset}: ${message}` : message,
        { cause },
      );
    }
  }

  const links = new Map<string, { url: string; line: number }>();

  for (const { url, line } of candidates) {
    if (!isLocalMediaUrl(url)) continue;

    const normalized = normalizeMediaUrl(url);
    links.set(`${line}:${normalized}`, { url: normalized, line });
  }

  return [...links.values()].sort((a, b) => a.line - b.line);
}
