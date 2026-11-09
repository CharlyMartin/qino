import type { Depth } from "./resolve";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { AnyPrimitive, JsonPathArray } from "./utils";

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

export type RelationConfig = {
  target: RelationTarget;
  /** Hops this relation resolves when a view uses each relation's own depth. Defaults to 1; 0 keeps the string. */
  resolveDepth?: Depth;
};

/** A target, or a target with options. */
export type RelationDeclaration = RelationTarget | RelationConfig;

export type Relations<Schema extends ObjectSchema> = {
  [P in RelationPath<ValidatedOutput<Schema>>]?: RelationDeclaration;
};

/** Relations as stored on a primitive, erased from its schema. */
export type AnyRelations = Record<string, RelationDeclaration | undefined>;
