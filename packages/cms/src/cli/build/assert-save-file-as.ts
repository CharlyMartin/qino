import { MEDIA_PATH_TOKENS } from "../../data/globals";
import { getPathTokens } from "./get-path-tokens";

/**
 * Fails on a `cloud.media.saveFileAs` the cloud UI can't fill in or that escapes
 * `mediaFolder`: unknown tokens, a `.` in the file name (the cloud UI adds
 * the extension), no file name, a leading `/`, or `..`.
 */
export function assertSaveFileAs(saveAs: string, primitiveId: string) {
  const prefix = `cloud.media.saveFileAs "${saveAs}" of "${primitiveId}"`;

  const segments = saveAs.split("/");
  const fileName = segments.at(-1) ?? "";

  if (saveAs.startsWith("/") || segments.includes("..")) {
    throw new Error(
      `${prefix} must be relative to mediaFolder, without a leading "/" or "..".`,
    );
  }

  if (fileName == "") {
    throw new Error(`${prefix} must end with a file name.`);
  }

  if (fileName.includes(".")) {
    throw new Error(
      `${prefix} can't contain "." in its file name: the cloud UI adds the extension.`,
    );
  }

  for (const token of getPathTokens(saveAs)) {
    if (!MEDIA_PATH_TOKENS.includes(token as never)) {
      throw new Error(
        `${prefix} has an unknown token "{${token}}". Use ${MEDIA_PATH_TOKENS.map((name) => `{${name}}`).join(", ")}.`,
      );
    }
  }
}
