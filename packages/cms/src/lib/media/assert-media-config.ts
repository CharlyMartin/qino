import { MARKDOWN_MEDIA_KEY } from "../../data/globals";
import type { AnyMediaConfig } from "../../types/media";
import { parsePath } from "../relations/parse-path";

type AssertMediaConfigParams = {
  media: AnyMediaConfig;
  relations: object;
  extension: string;
  primitiveId: string;
};

/**
 * Fails at definition on media keys that can't be read: malformed paths,
 * paths that are also relations, or `markdown` on JSON files, which have no
 * body. Types and MIME types are checked by `qino build` and `qino check`.
 */
export function assertMediaConfig({
  media,
  relations,
  extension,
  primitiveId,
}: AssertMediaConfigParams) {
  for (const path of Object.keys(media)) {
    const prefix = `media "${path}" of "${primitiveId}"`;

    if (path == MARKDOWN_MEDIA_KEY) {
      if (extension == ".json") {
        throw new Error(
          `${prefix} checks the Markdown body, but JSON files have none.`,
        );
      }
      continue;
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
