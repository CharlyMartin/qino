import type { IMAGE_MEDIA_TYPES } from "../data/globals";
import type { MarkdownStatsTag } from "./markdown-stats";
import type { MarkdownTocFlag, MarkdownTocTag } from "./markdown-toc";
import type { RelationPath } from "./relations";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { JsonPathArray } from "./utils";

// Type-only metadata, like `QinoInference`: never created at runtime.
declare const QinoMediaPaths: unique symbol;

type NonZeroDigit = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Digit = "0" | NonZeroDigit;
type Kilobytes = "50" | `${NonZeroDigit}${"00" | "50"}`;
type Megabytes = NonZeroDigit | `${NonZeroDigit}${Digit}` | "100";

/** 50–950KB in steps of 50, or 1–100MB, where 1KB = 1024 bytes. */
export type MediaSize = `${Kilobytes}KB` | `${Megabytes}MB`;

export type ImageMediaType = (typeof IMAGE_MEDIA_TYPES)[number];

/** An exact MIME type, such as `"image/webp"` or `"application/pdf"`. */
export type MediaType = ImageMediaType | (string & {});

export type MediaParseContext = {
  /** The file the value was written in, not the file it points to. */
  sourceFilePath: string;
  /**
   * The field's path as declared in `media`, e.g. `"gallery[*]"`, not the
   * element's index. `"markdown"` for files the body embeds.
   */
  fieldPath: string;
  mediaFolder: string;
};

/**
 * Turns a raw value into a URL in `mediaFolder`, e.g. `"[[cover.jpg]]"` into
 * `"/attachments/cover.jpg"`. Return `undefined` to read the value as a URL as
 * is.
 */
export type MediaParse = (
  value: string,
  ctx: MediaParseContext,
) => string | undefined;

/**
 * The files a media field, or the Markdown body, accepts. `parse` turns a raw
 * value into a URL in `mediaFolder` first.
 */
export type MediaRule = {
  /** The one MIME type the rule accepts, e.g. `"image/webp"`. */
  readonly accepted: MediaType;
  /** Maximum file size, e.g. `"5MB"` or `"600KB"`. */
  readonly maxSize: MediaSize;
  readonly parse?: MediaParse;
};

/**
 * Media fields, keyed by relation-style paths to string fields: `"cover"`,
 * `"gallery[*]"`, `"seo.image"`. Files the body embeds go in `markdown.media`.
 */
export type MediaConfig<Schema extends ObjectSchema> = {
  readonly [P in RelationPath<ValidatedOutput<Schema>>]?: MediaRule;
};

/** Flags keys of `media` that aren't paths to string fields. */
export type CheckMediaKeys<
  Media,
  Schema extends ObjectSchema,
> = string extends keyof Media
  ? unknown
  : {
      readonly [K in Exclude<keyof Media, keyof MediaConfig<Schema>>]: {
        readonly "Not a path to a string field": K;
      };
    };

/** An image field once read, shaped like Next's `StaticImageData`. */
export type QinoImage = {
  src: string;
  width: number;
  height: number;
  /** Only for JPEG, PNG, WebP, and AVIF, as with Next. */
  blurDataURL?: string;
  blurWidth?: number;
  blurHeight?: number;
};

/** Paths of `media` whose `accepted` type is an image. */
export type ImagePaths<Media> = {
  [K in keyof Media & string]: Media[K] extends {
    readonly accepted: ImageMediaType;
  }
    ? K
    : never;
}[keyof Media & string];

/**
 * Type-only tag carried on `Rels`, which already flows into every entry type:
 * symbol keys are ignored by relation path matching.
 */
export type MediaPathsTag<Paths extends string> = [Paths] extends [never]
  ? unknown
  : { readonly [QinoMediaPaths]?: Paths };

export type TaggedRelations<
  Rels,
  Media,
  Stats extends boolean = false,
  Toc extends MarkdownTocFlag = false,
> = Rels &
  MediaPathsTag<ImagePaths<Media>> &
  MarkdownStatsTag<Stats> &
  MarkdownTocTag<Toc>;

// Checks the key itself: erased relations' index signatures would match `?:`.
type TaggedPaths<Rels> = typeof QinoMediaPaths extends keyof Rels
  ? Extract<Rels[typeof QinoMediaPaths], string>
  : never;

type JoinPath<Prefix extends string, K extends string> = Prefix extends ""
  ? K
  : `${Prefix}.${K}`;

type PathBelow<Prefix extends string> = Prefix extends ""
  ? string
  : `${Prefix}.${string}` | `${Prefix}${JsonPathArray}${string}`;

type MapImages<
  T,
  Paths extends string,
  Prefix extends string,
> = Prefix extends Paths
  ? (T & (undefined | null)) | QinoImage
  : [Extract<Paths, PathBelow<Prefix>>] extends [never]
    ? T
    : T extends ReadonlyArray<infer U>
      ? Array<MapImages<U, Paths, `${Prefix}${JsonPathArray}`>>
      : T extends object
        ? {
            [K in keyof T]: K extends string
              ? MapImages<T[K], Paths, JoinPath<Prefix, K>>
              : T[K];
          }
        : T;

/** Replaces the strings at the image paths tagged on `Rels` with `QinoImage`. */
export type WithImages<T, Rels> = [TaggedPaths<Rels>] extends [never]
  ? T
  : MapImages<T, TaggedPaths<Rels>, "">;

/** Media config as stored on a primitive, erased from its schema. */
export type AnyMediaConfig = {
  readonly [path: string]: MediaRule | undefined;
};
