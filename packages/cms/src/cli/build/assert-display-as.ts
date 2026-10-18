import { getPathTokens } from "./get-path-tokens";

/**
 * A primitive's `displayAs` is its plain name in the cloud UI. Fails when it's
 * empty, or has `{field}` tokens, which belong in `displayEntryAs`.
 */
export function assertDisplayAs(displayAs: string, primitiveId: string) {
  const prefix = `displayAs "${displayAs}" of "${primitiveId}"`;

  if (displayAs.trim() == "") {
    throw new Error(`${prefix} is empty. Name the primitive, or leave it out.`);
  }

  if (getPathTokens(displayAs).length > 0) {
    throw new Error(
      `${prefix} names the primitive, so it takes no {field}. Label entries with displayEntryAs.`,
    );
  }
}
