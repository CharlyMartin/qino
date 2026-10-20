/** Strips query and hash, then decodes each path segment, `%23` included. */
export function normalizeMediaUrl(url: string) {
  return url
    .replace(/[?#].*$/u, "")
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}
