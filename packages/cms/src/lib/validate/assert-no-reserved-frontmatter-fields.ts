import { MARKDOWN_FIELD_NAME, META_FIELD_NAME } from "../../data/globals";

export function assertNoReservedFrontmatterFields(
  data: unknown,
  filePath: string,
) {
  if (typeof data != "object" || data == null) return;

  const reservedFields = [META_FIELD_NAME, MARKDOWN_FIELD_NAME];
  const conflicts = reservedFields.filter((key) => Object.hasOwn(data, key));

  if (conflicts.length > 0) {
    throw new Error(
      `${filePath}: fields reserved for Qino cannot appear in content or schema output: ${conflicts.join(", ")}.`,
    );
  }
}
