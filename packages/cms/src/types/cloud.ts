import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ObjectSchema } from "./schema";

type NonZeroDigit = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Digit = "0" | NonZeroDigit;
type Kilobytes = "50" | `${NonZeroDigit}${"00" | "50"}`;
type Megabytes = NonZeroDigit | `${NonZeroDigit}${Digit}` | "100";

/** 50–950KB in steps of 50, or 1–100MB, where 1KB = 1024 bytes. */
export type CloudMediaSize = `${Kilobytes}KB` | `${Megabytes}MB`;

export type CloudMediaType = {
  /** MIME type, wildcards allowed: `"image/webp"`, `"image/*"`. */
  readonly type: string;
  /** Maximum file size, e.g. `"5MB"` or `"600KB"`. */
  readonly maxSize: CloudMediaSize;
};

export type CloudMediaConfig = {
  /**
   * File types editors can upload. Unset, the cloud UI accepts any type up
   * to 5 MB. `[]` disables uploads.
   */
  readonly accepted?: ReadonlyArray<CloudMediaType>;
};

type CloudPublishReview = {
  /** Whether an approver signs off in Qino before the author can publish. */
  readonly reviewBeforePublish: boolean;
};

export type CloudPublishConfig =
  | (CloudPublishReview & {
      readonly mode: "open_pull_request";
      /** Prefix of the branches the cloud UI opens. Defaults to `"qino/"`. */
      readonly branchPrefix?: string;
    })
  | (CloudPublishReview & { readonly mode: "commit_to_default_branch" });

export type CloudConfig = {
  readonly publish: CloudPublishConfig;
  readonly media?: CloudMediaConfig;
};

export type PrimitiveCloudMediaConfig = CloudMediaConfig & {
  /**
   * File path an upload is saved to when publishing, relative to
   * `mediaFolder`. Tokens: `{id}`, `{name}`, `{hash}`, `{ext}`. E.g.
   * `"posts/{name}-{hash}.{ext}"` saves `cover.webp` as
   * `public/posts/cover-1a2b3c4d.webp`. Defaults to `"{id}/{name}-{hash}.{ext}"`.
   */
  readonly saveAs?: string;
};

type Scalar = string | number | boolean | null | undefined;

/**
 * Fields as on disk, before transforms: the cloud UI reads files. Falls back
 * to any field name when a validator's input isn't an object type.
 */
type InputFields<Schema extends ObjectSchema> =
  StandardSchemaV1.InferInput<Schema> extends Record<string, unknown>
    ? StandardSchemaV1.InferInput<Schema>
    : Record<string, Scalar>;

type TopLevelKeys<Schema extends ObjectSchema> = keyof InputFields<Schema> &
  string;

type ScalarKeys<Schema extends ObjectSchema> = {
  [K in TopLevelKeys<Schema>]: InputFields<Schema>[K] extends Scalar
    ? K
    : never;
}[TopLevelKeys<Schema>];

export type ItemCloudConfig = {
  readonly media?: PrimitiveCloudMediaConfig;
};

export type TreeCloudConfig<Schema extends ObjectSchema> = ItemCloudConfig & {
  /** Fields the cloud UI searches. Unset, there's no search. */
  readonly searchableBy?: ReadonlyArray<TopLevelKeys<Schema>>;
};

export type CollectionCloudConfig<Schema extends ObjectSchema> =
  TreeCloudConfig<Schema> & {
    /** Scalar fields the cloud UI sorts by. Unset, there's no sorting. */
    readonly sortableBy?: ReadonlyArray<ScalarKeys<Schema>>;
  };

/** Cloud config as stored on a primitive, erased from its schema. */
export type PrimitiveCloudConfig = {
  readonly searchableBy?: ReadonlyArray<string>;
  readonly sortableBy?: ReadonlyArray<string>;
  readonly media?: PrimitiveCloudMediaConfig;
};
