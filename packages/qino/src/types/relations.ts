import type { AnyCollection } from "./collection";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { AnySingleton } from "./singleton";
import type { JsonPathArray } from "./utils";

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

export type RelationTarget =
  | AnyCollection
  | AnySingleton
  | (() => AnyCollection | AnySingleton);

export type Relations<Schema extends ObjectSchema> = {
  [P in RelationPath<ValidatedOutput<Schema>>]?: RelationTarget;
};
