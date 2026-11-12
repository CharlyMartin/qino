/**
 * Turns a relation value into a content path (relative to `contentFolder`).
 *
 * Values already starting with `targetPath` are returned as-is. Otherwise the
 * value may be a root path: a path from the project or repository root that
 * goes through the content folder, e.g. `src/content/authors/jane.json` or
 * `apps/site/src/content/authors/jane.json` (as written by Decap CMS). The part
 * before `targetPath` must match the end of `contentFolder`, segment by
 * segment, and is stripped. Anything else is returned unchanged so the caller
 * can report the mismatch.
 *
 * `contentFolder` is absolute, or from the repository root, and is never
 * resolved against the working directory: `.` and `..` segments are folded,
 * and `\` reads as `/`.
 */
export function toContentPath(
  value: string,
  contentFolder: string,
  targetPath: string,
) {
  if (targetPath != "" && value.startsWith(targetPath)) return value;

  const segments: Array<string> = [];
  for (const segment of contentFolder.replaceAll("\\", "/").split("/")) {
    if (segment == "..") segments.pop();
    else if (segment != "" && segment != ".") segments.push(segment);
  }
  const folder = `/${segments.join("/")}`;

  let index = value.indexOf(`/${targetPath}`);

  while (index != -1) {
    const prefix = value.slice(0, index);
    if (prefix != "" && folder.endsWith(`/${prefix}`)) {
      return value.slice(index + 1);
    }
    index = value.indexOf(`/${targetPath}`, index + 1);
  }

  return value;
}
