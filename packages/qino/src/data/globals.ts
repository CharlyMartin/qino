export const QinoMeta = Symbol.for("qino.meta");
export const JSON_PATH_ARRAY = "[*]";
export const META_FIELD_NAME = "_meta";
export const MARKDOWN_BODY_FIELD_NAME = "body";
export const SUPPORTED_CONTENT_EXTENSIONS = [
  ".md",
  ".mdx",
  ".markdown",
  ".json",
] as const;
export const ROOT_FOLDER_NAME = "qino";
export const COLLECTIONS_FOLDER_NAME = "collections";
export const SINGLETONS_FOLDER_NAME = "singletons";
export const TREES_FOLDER_NAME = "trees";
export const DEFAULT_ORDER_FILE_NAME = "_order.json";
export const ENTRY_FILE_NAME = "index.ts";
export const MAX_RESOLVE_DEPTH = 6;
export const SUPPORTED_CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
] as const;

export const QinoPrimitives = {
  collection: "collection",
  singleton: "singleton",
  tree: "tree",
} as const;
