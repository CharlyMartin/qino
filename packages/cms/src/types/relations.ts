import type { Depth } from "./resolve";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type {
  AnyPrimitive,
  ContentPath,
  JsonPathArray,
  SupportedFileExtension,
} from "./utils";

export type RelationPath<T, Prefix extends string = ""> =
  NonNullable<T> extends string
    ? Prefix
    : NonNullable<T> extends Array<infer U>
      ? RelationPath<U, `${Prefix}${JsonPathArray}`>
      : NonNullable<T> extends Record<string, unknown>
        ? {
            [K in keyof NonNullable<T> & string]: RelationPath<
              NonNullable<T>[K],
              Prefix extends "" ? K : `${Prefix}.${K}`
            >;
          }[keyof NonNullable<T> & string]
        : never;

export type RelationTarget = AnyPrimitive | (() => AnyPrimitive);

/** Where a relation's target lives, to build a content path from. */
export type RelationParseTarget =
  | {
      is: "collection" | "tree";
      contentFolder: string;
      directory: ContentPath;
      extension: SupportedFileExtension;
    }
  | { is: "item"; contentFolder: string; file: ContentPath };

export type RelationParseContext = {
  /** The file the value was written in, not the file it points to. */
  sourceFilePath: string;
  /** The relation's path, e.g. `"categories[*]"`. */
  path: string;
  target: RelationParseTarget;
};

/**
 * Turns a raw value into a content path, e.g. `"[[Jane Doe]]"` into
 * `"authors/Jane Doe.md"`. Return `undefined` to read the value as a content
 * path as is.
 */
export type RelationParse = (
  value: string,
  ctx: RelationParseContext,
) => string | undefined;

export type RelationConfig = {
  target: RelationTarget;
  /** Hops this relation resolves when a view uses each relation's own depth. Defaults to 1; 0 keeps the string. */
  resolveDepth?: Depth;
  parse?: RelationParse;
};

/** A target, or a target with options. */
export type RelationDeclaration = RelationTarget | RelationConfig;

export type Relations<Schema extends ObjectSchema> = {
  [P in RelationPath<ValidatedOutput<Schema>>]?: RelationDeclaration;
};

/** Relations as stored on a primitive, erased from its schema. */
export type AnyRelations = Record<string, RelationDeclaration | undefined>;
