import type { IntClosedRange, Simplify, Subtract } from "type-fest";

import type {
  MAX_RESOLVE_DEPTH,
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../data";
import type { CollectionEntryMeta } from "./collection";
import type { ItemEntryMeta } from "./item";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { TreeEntryMeta } from "./tree";
import type { JsonPathArray, SupportedFileExtension } from "./utils";

export type MaxDepth = typeof MAX_RESOLVE_DEPTH;
export type Depth = IntClosedRange<0, MaxDepth>;
export type ResolveOption = boolean | IntClosedRange<1, MaxDepth>;

export type NormalizeDepth<R extends ResolveOption> = R extends true
  ? MaxDepth
  : R extends false
    ? 0
    : R extends Depth
      ? R
      : never;

type Dec<D extends Depth> = Subtract<D, 1> extends Depth ? Subtract<D, 1> : 0;

type JoinPath<Prefix extends string, K extends string> = Prefix extends ""
  ? K
  : `${Prefix}.${K}`;

// Require a path separator so "people" does not match "peopleX.foo".
type RelationKeyBelow<Prefix extends string> = Prefix extends ""
  ? string
  : `${Prefix}.${string}` | `${Prefix}${JsonPathArray}${string}`;

type MatchesBelow<K extends string, Prefix extends string> =
  K extends RelationKeyBelow<Prefix> ? true : never;

type HasRelationBelow<Prefix extends string, Rels> = [
  MatchesBelow<keyof Rels & string, Prefix>,
] extends [never]
  ? false
  : true;

type ResolveValue<
  T,
  Rels,
  PathPrefix extends string,
  D extends Depth,
> = PathPrefix extends keyof Rels & string
  ? (T & (undefined | null)) | ResolveTarget<Rels[PathPrefix], D>
  : HasRelationBelow<PathPrefix, Rels> extends true
    ? T extends ReadonlyArray<infer U>
      ? Array<ResolveValue<U, Rels, `${PathPrefix}${JsonPathArray}`, D>>
      : T extends object
        ? {
            [K in keyof T]: K extends string
              ? ResolveValue<T[K], Rels, JoinPath<PathPrefix, K>, D>
              : T[K];
          }
        : T
    : T;

type ResolveTarget<Target, D extends Depth> = D extends 0
  ? string
  : NonNullable<Target> extends () => infer C
    ? ResolveRelationTarget<C, Dec<D>>
    : ResolveRelationTarget<NonNullable<Target>, Dec<D>>;

type ResolveRelationTarget<C, NextD extends Depth> = C extends {
  readonly [QinoPrimitiveMarker]: {
    is: infer Kind;
    schema: infer S;
    extension: infer Ext;
    relations: infer Rels;
    directory: string;
  };
}
  ? Ext extends SupportedFileExtension
    ? S extends ObjectSchema
      ? Simplify<
          {
            [K in typeof META_FIELD_NAME]: Kind extends (typeof QinoPrimitives)["tree"]
              ? TreeEntryMeta<Ext>
              : CollectionEntryMeta<Ext>;
          } & ResolveEntry<S, Rels, NextD>
        >
      : never
    : never
  : C extends {
        readonly [QinoPrimitiveMarker]: {
          schema: infer S;
          extension: infer Ext;
          relations: infer Rels;
          file: string;
        };
      }
    ? Ext extends SupportedFileExtension
      ? S extends ObjectSchema
        ? Simplify<
            {
              [K in typeof META_FIELD_NAME]: ItemEntryMeta<Ext>;
            } & ResolveEntry<S, Rels, NextD>
          >
        : never
      : never
    : never;

export type ResolveEntry<
  S extends ObjectSchema,
  Rels,
  D extends Depth,
> = D extends 0
  ? ValidatedOutput<S>
  : ResolveValue<ValidatedOutput<S>, Rels, "", D>;
