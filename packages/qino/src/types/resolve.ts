import type { Simplify, Subtract, IntClosedRange } from "type-fest";
import type { QinoMeta } from "../runtime/globals";
import type {
  EntryMeta,
  JsonPathArray,
  ObjectSchema,
  SupportedFileExtension,
  ValidatedOutput,
} from "./index";
import type { MAX_DEPTH } from "../runtime/relations/normalize-depth";

export type MaxDepth = typeof MAX_DEPTH;
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

type ResolveValue<
  T,
  Rels,
  PathPrefix extends string,
  D extends Depth,
> = PathPrefix extends keyof Rels & string
  ? (T & (undefined | null)) | ResolveTarget<Rels[PathPrefix], D>
  : T extends ReadonlyArray<infer U>
    ? Array<ResolveValue<U, Rels, `${PathPrefix}${JsonPathArray}`, D>>
    : T extends object
      ? T extends (...args: Array<unknown>) => unknown
        ? T
        : {
            [K in keyof T & string]: ResolveValue<
              T[K],
              Rels,
              JoinPath<PathPrefix, K>,
              D
            >;
          }
      : T;

type ResolveTarget<Target, D extends Depth> = D extends 0
  ? string
  : NonNullable<Target> extends () => infer C
    ? ResolveCollectionTarget<C, Dec<D>>
    : ResolveCollectionTarget<NonNullable<Target>, Dec<D>>;

type ResolveCollectionTarget<C, NextD extends Depth> = C extends {
  readonly [QinoMeta]: {
    schema: infer S;
    extension: infer Ext;
    relations: infer Rels;
  };
}
  ? Ext extends SupportedFileExtension
    ? S extends ObjectSchema
      ? Simplify<{ _meta: EntryMeta<Ext> } & ResolveEntry<S, Rels, NextD>>
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
