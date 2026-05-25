export function removeLeadingSlash(path: string) {
  return path.startsWith("/") ? path.slice(1) : path;
}
