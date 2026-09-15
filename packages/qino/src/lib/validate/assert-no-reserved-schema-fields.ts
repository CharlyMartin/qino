import { META_FIELD_NAME } from "../../data/globals";

export function assertNoReservedSchemaFields(data: unknown, filePath: string) {
  if (typeof data != "object" || data == null) return;

  if (Object.hasOwn(data, META_FIELD_NAME)) {
    throw new Error(
      `${filePath}: fields reserved for Qino cannot appear in content or schema output: ${META_FIELD_NAME}.`,
    );
  }
}
