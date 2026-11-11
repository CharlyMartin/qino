import { MARKDOWN_FIELD_NAME } from "../../data/globals";
import type { AnyMediaConfig } from "../../types/media";
import { parsePath } from "../relations/parse-path";

type AssertMediaConfigParams = {
  media: AnyMediaConfig;
  relations: object;
  primitiveId: string;
};

/**
 * Fails at definition on media keys that can't be read: malformed paths,
 * paths that are also relations, or `markdown`, whose rules moved to
 * `markdown.media`. Types and MIME types are checked by `qino build` and
 * `qino check`.
 */
export function assertMediaConfig({
  media,
  relations,
  primitiveId,
}: AssertMediaConfigParams) {
  for (const path of Object.keys(media)) {
    const prefix = `media "${path}" of "${primitiveId}"`;

    if (path == MARKDOWN_FIELD_NAME) {
      throw new Error(
        `${prefix} is the Markdown body: set its rules in markdown.media.`,
      );
    }

    try {
      parsePath(path);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      throw new Error(`${prefix} isn't a valid path: ${message}`, { cause });
    }

    if (Object.hasOwn(relations, path)) {
      throw new Error(
        `${prefix} is also a relation. A field holds either a media URL or a reference.`,
      );
    }
  }
}
