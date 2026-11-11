import { extractMediaCandidates } from "./extract-media-candidates";
import { isLocalMediaUrl } from "./is-local-media-url";
import { normalizeMediaUrl } from "./normalize-media-url";

/** Lists the local media URLs of a content file, normalized and sorted. */
export function extractMediaLinks(raw: string, extension: string) {
  const links = new Map<
    string,
    { url: string; line: number; image: boolean }
  >();

  for (const { url, line, image } of extractMediaCandidates(raw, extension)) {
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
