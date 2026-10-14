import { MEDIA_PATH_TOKENS } from "../../data/globals";

const TOKEN_PATTERN = /\{([^}]*)\}/g;

/**
 * Fails on a `media.saveAs` the cloud UI can't fill in or that escapes
 * `mediaFolder`: unknown tokens, no trailing `.{ext}`, a leading `/`, or `..`.
 */
export function assertMediaSaveAs(saveAs: string, primitiveId: string) {
  const prefix = `media.saveAs "${saveAs}" of "${primitiveId}"`;

  for (const [, token] of saveAs.matchAll(TOKEN_PATTERN)) {
    if (!MEDIA_PATH_TOKENS.includes(token as never)) {
      throw new Error(
        `${prefix} has an unknown token "{${token}}". Use ${MEDIA_PATH_TOKENS.map((name) => `{${name}}`).join(", ")}.`,
      );
    }
  }

  if (!saveAs.endsWith(".{ext}")) {
    throw new Error(`${prefix} must end with ".{ext}".`);
  }

  if (saveAs.startsWith("/") || saveAs.split("/").includes("..")) {
    throw new Error(
      `${prefix} must be relative to mediaFolder, without a leading "/" or "..".`,
    );
  }
}
