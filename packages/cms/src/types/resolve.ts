import type { IntClosedRange, Simplify, Subtract } from "type-fest";

import type {
  DEFAULT_RESOLVE_DEPTH,
  MAX_RESOLVE_DEPTH,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../data/globals";
import type { CollectionEntryMeta } from "./collection";
import type { GeneratedFields } from "./generated-fields";
import type { ItemEntryMeta } from "./item";
import type { WithStats } from "./markdown-stats";
import type { WithToc } from "./markdown-toc";
import type { WithImages } from "./media";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { TreeEntryMeta } from "./tree";
import type {
  EmptyObject,
  JsonPathArray,
  SupportedFileExtension,
} from "./utils";

export type MaxDepth = typeof MAX_RESOLVE_DEPTH;
type DefaultResolveDepth = typeof DEFAULT_RESOLVE_DEPTH;
export type Depth = IntClosedRange<0, MaxDepth>;

/** A view's `resolveDepth`: hops for some relations, keyed by path. */
export type ResolveDepths = { readonly [path: string]: Depth | undefined };

/** The relation paths of a primitive, without media and stats tags. */
export type RelationPath<Rels> = Extract<keyof Rels, string>;

export type ViewResolveDepth<Rels> = {
  readonly [P in RelationPath<Rels>]?: Depth;
};

/**
 * How far relations resolve: `depth` hops left, and whether that depth
 * overrides each relation's own `resolveDepth` or only caps it.
 */
export type ResolveMode = { depth: Depth; override: boolean };

/** Each relation resolves its own `resolveDepth`. */
type RootMode = { depth: MaxDepth; override: false };

/** Relations stay strings: entries as read, before a view applies. */
export type UnresolvedMode = { depth: 0; override: true };

// A depth the view sets overrides the whole branch below that relation.
// Distributes over `R`: each alternative of a union config sets its own keys.
type ModeAt<P extends string, R, M extends ResolveMode> = R extends unknown
  ? P extends keyof R
    ?
        | (Extract<R[P], Depth> extends infer D extends Depth
            ? D extends unknown
              ? { depth: D; override: true }
              : never
            : never)
        | (undefined extends R[P] ? M : never)
    : M
  : never;

type Dec<D extends Depth> = Subtract<D, 1> extends Depth ? Subtract<D, 1> : 0;

type Min<A extends Depth, B extends Depth> =
  B extends IntClosedRange<0, A> ? B : A;

type DeclTarget<Decl> = Decl extends { target: infer T } ? T : Decl;

// Per alternative of a union declaration: an optional `resolveDepth` can hold
// any of its values, or fall back to the default.
type DeclDepth<Decl> = Decl extends unknown
  ? "resolveDepth" extends keyof Decl
    ?
        | Extract<Decl["resolveDepth"], Depth>
        | (undefined extends Decl["resolveDepth"] ? DefaultResolveDepth : never)
    : DefaultResolveDepth
  : never;

type Hops<Decl, M extends ResolveMode> = M["override"] extends true
  ? M["depth"]
  : Min<M["depth"], DeclDepth<Decl>>;

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
  R,
  M extends ResolveMode,
> = PathPrefix extends keyof Rels & string
  ?
      | (T & (undefined | null))
      | ResolveTarget<NonNullable<Rels[PathPrefix]>, ModeAt<PathPrefix, R, M>>
  : HasRelationBelow<PathPrefix, Rels> extends true
    ? T extends ReadonlyArray<infer U>
      ? Array<ResolveValue<U, Rels, `${PathPrefix}${JsonPathArray}`, R, M>>
      : T extends object
        ? {
            [K in keyof T]: K extends string
              ? ResolveValue<T[K], Rels, JoinPath<PathPrefix, K>, R, M>
              : T[K];
          }
        : T
    : T;

// Distributes over `M`: a view depth typed as a union resolves either way.
type ResolveTarget<Decl, M extends ResolveMode> = M extends ResolveMode
  ? Hops<Decl, M> extends infer H extends Depth
    ? H extends 0
      ? string
      : ResolveRelationTarget<
          DeclTarget<Decl> extends () => infer C ? C : DeclTarget<Decl>,
          { depth: Dec<H>; override: M["override"] }
        >
    : never
  : never;

type ResolveRelationTarget<C, Next extends ResolveMode> = C extends {
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
          GeneratedFields<
            Kind extends (typeof QinoPrimitives)["tree"]
              ? TreeEntryMeta<Ext>
              : CollectionEntryMeta<Ext>
          > &
            ResolveEntry<S, Rels, EmptyObject, Next>
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
            GeneratedFields<ItemEntryMeta<Ext>> &
              ResolveEntry<S, Rels, EmptyObject, Next>
          >
        : never
      : never
    : never;

/**
 * An entry with its relations resolved: `R` holds the view's depths by
 * relation path, `M` the mode of relations it leaves out.
 */
export type ResolveEntry<
  S extends ObjectSchema,
  Rels,
  R = EmptyObject,
  M extends ResolveMode = RootMode,
> = WithToc<
  WithStats<
    WithImages<
      M["depth"] extends 0
        ? ValidatedOutput<S>
        : ResolveValue<ValidatedOutput<S>, Rels, "", R, M>,
      Rels
    >,
    Rels
  >,
  Rels
>;
