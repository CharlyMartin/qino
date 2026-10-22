export const QinoPrimitiveMarker = Symbol.for("qino.primitive");
export const QinoViewMarker = Symbol("qino.view");
export const QinoConfigMarker = Symbol.for("qino.config");

export const JSON_PATH_ARRAY = "[*]";
export const META_FIELD_NAME = "_meta";
export const MARKDOWN_FIELD_NAME = "markdown";
export const RAW_FIELD_NAME = "raw";
export const STATS_FIELD_NAME = "_stats";
export const SUPPORTED_CONTENT_EXTENSIONS = [
  ".md",
  ".mdx",
  ".markdown",
  ".json",
] as const;

export const ROOT_FOLDER_NAME = "qino";
export const ENTRY_FILE_NAME = "index.ts";
export const GENERATED_DIR_NAME = "_generated";
export const GENERATED_TYPES_FILE_NAME = "types.d.ts";
export const GENERATED_CONFIG_FILE_NAME = "config.json";
export const CONFIG_FILE_VERSION = 1;

export const DEFAULT_ORDER_FILE_NAME = "_order.json";
export const DEFAULT_BRANCH_PREFIX = "qino/";
export const DEFAULT_MEDIA_SAVE_AS = "{id}/{name}-{hash}";
export const MEDIA_PATH_TOKENS = ["id", "field", "name", "hash"] as const;
export const MARKDOWN_MEDIA_KEY = "markdown";
/**
 * Types Next imports as images (`next-image-loader`) that sharp can read:
 * no `.ico` or `.bmp`.
 */
export const IMAGE_MEDIA_TYPES = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
  "image/webp",
] as const;
/** Images Next makes a blur placeholder for (`VALID_BLUR_EXT`). */
export const BLURRABLE_MEDIA_TYPES = [
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const BLUR_SIZE = 8;
export const BLUR_QUALITY = 70;
export const MAX_RESOLVE_DEPTH = 6;
export const SUPPORTED_CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
] as const;

export const QinoPrimitives = {
  collection: "collection",
  item: "item",
  tree: "tree",
} as const;
