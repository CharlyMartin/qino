export function isLocalMediaUrl(url: string) {
  return url.startsWith("/") && !url.startsWith("//");
}
