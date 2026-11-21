export const QinoPrimitiveMarker = Symbol.for("qino.primitive");
export const QinoViewMarker = Symbol("qino.view");
export const QinoConfigMarker = Symbol.for("qino.config");

export const JSON_PATH_ARRAY = "[*]";
export const META_FIELD_NAME = "_meta";
export const MARKDOWN_FIELD_NAME = "markdown";
export const RAW_FIELD_NAME = "raw";
export const STATS_FIELD_NAME = "_stats";
export const TOC_FIELD_NAME = "_toc";
export const MARKDOWN_HEADING_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
] as const;
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
/** Folder of the content folder holding the image manifest, skipped by content globs. */
export const IMAGE_MANIFEST_DIR_NAME = ".qino";
export const IMAGE_MANIFEST_FILE_NAME = "images.json";

export const DEFAULT_ORDER_FILE_NAME = "_order.json";
export const DEFAULT_BRANCH_PREFIX = "qino/";
export const DEFAULT_MEDIA_SAVE_AS = "{id}/{name}-{hash}";
export const MEDIA_PATH_TOKENS = ["id", "field", "name", "hash"] as const;
/** Key of `markdown.media` within a primitive's `media` in `config.json`. */
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
export const DEFAULT_RESOLVE_DEPTH = 1;
export const SUPPORTED_CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
] as const;
/** A test file's name, such as `posts.test.ts`: definitions can sit beside their tests. */
export const TEST_FILE_NAME = /\.(?:test|test-d|spec)\./;

export const QinoPrimitives = {
  collection: "collection",
  item: "item",
  tree: "tree",
} as const;
/**
 * Files read at once, across the process. On Node 22, reading thousands of
 * files at once fails with `EMFILE` under a 1,024 open-file limit, as on AWS
 * Lambda. 64 leaves room under that limit and reads as fast as no cap.
 */
export const MAX_CONCURRENT_FILE_READS = 64;

/**
 * Timestamps can be as coarse as 2s (FAT), so a file edited this close to a
 * read can change again without its stats changing. Caches compare such a
 * file by content, or read it again, until its mtime is old enough to trust.
 */
export const RECENT_EDIT_MS = 2_000;
