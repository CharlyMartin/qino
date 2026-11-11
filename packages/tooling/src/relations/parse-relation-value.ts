import { toContentPath } from "./to-content-path";
import { toDirectoryPrefix } from "./to-directory-prefix";

/** A relation's target, with the fields `config.json` gives it. */
export type RelationValueTarget =
  | { kind: "item"; file: string }
  | { kind: "collection" | "tree"; directory: string; extension: string };

type ParseRelationValueOptions = {
  /**
   * The project's `contentFolder`: absolute, or from the repository root,
   * with `/` separators. Root paths must go through it.
   */
  contentFolder: string;
  /** Names the relation in errors, e.g. `Relation "author" in posts/a.md`. */
  owner: string;
};

/**
 * Reads a relation value as `qino build` does: a content path like
 * `authors/jane.json`, or a root path through the content folder like
 * `src/content/authors/jane.json`. Returns the entry's slug (`jane`), or the
 * file of an item target. Fails on a value that doesn't point into the target.
 */
export function parseRelationValue(
  value: string,
  target: RelationValueTarget,
  { contentFolder, owner }: ParseRelationValueOptions,
) {
  if (value.startsWith("/")) {
    throw new Error(
      `${owner}: value "${value}" must be relative to contentFolder, without a leading "/". Use "${value.replace(/^\/+/, "")}".`,
    );
  }

  if (target.kind == "item") {
    const expected = target.file;
    const normalized = toContentPath(value, contentFolder, expected);

    if (normalized != expected) {
      throw new Error(
        `${owner}: expected value "${expected}" (target item "${target.file}"), got "${value}".`,
      );
    }

    return normalized; // value is irrelevant for items, since they always resolve to the same file
  }

  const expectedPrefix = toDirectoryPrefix(target.directory);
  const expectedExt = target.extension;
  const normalized = toContentPath(value, contentFolder, expectedPrefix);

  if (!normalized.startsWith(expectedPrefix)) {
    throw new Error(
      `${owner}: expected value under "${expectedPrefix}" (target ${target.kind} "${target.directory}"), got "${value}".`,
    );
  }

  if (!normalized.endsWith(expectedExt)) {
    throw new Error(
      `${owner}: expected value ending with "${expectedExt}" (target ${target.kind} "${target.directory}"), got "${value}".`,
    );
  }

  return normalized.slice(
    expectedPrefix.length,
    normalized.length - expectedExt.length,
  );
}
