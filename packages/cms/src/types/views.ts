import type { Simplify } from "type-fest";

import type { QinoViewMarker } from "../data/globals";
import type { AugmentOutput, Awaitable, EntryAugment } from "./augment";
import type { GeneratedFields } from "./generated-fields";
import type {
  RelationPath,
  ResolveDepths,
  ResolveEntry,
  ViewResolveDepth,
} from "./resolve";
import type { ObjectSchema } from "./schema";
import type { EmptyObject, GetterOptions } from "./utils";

export type ViewEntry<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveDepths,
> = Simplify<GeneratedFields<Meta> & ResolveEntry<S, Rels, R>>;

// Only the primitive's relation paths: an unknown one is a typo.
type CheckResolveDepthKeys<R, Rels> = Record<
  Exclude<keyof R, RelationPath<Rels>>,
  never
>;

export type ViewConfig<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveDepths,
  Derived extends AugmentOutput,
> = {
  /** Hops for some relations, by path. Others resolve their own `resolveDepth`. */
  resolveDepth?: R;
  augment?: EntryAugment<S, Meta, Derived, Rels, NoInfer<R>>;
} & NoInfer<ResolveDepthCheck<R, Rels>>;

// Checked apart from `resolveDepth?: R`, so a union-typed config infers whole.
type ResolveDepthCheck<R, Rels> = {
  resolveDepth?: ViewResolveDepth<Rels> & CheckResolveDepthKeys<R, Rels>;
};

// Drops the config's checked `resolveDepth` so the view reads back as `R`.
export type DefinedView<Config, R extends ResolveDepths> = Omit<
  Config,
  "resolveDepth"
> & {
  readonly [QinoViewMarker]: true;
  resolveDepth: R;
};

// Keep inference local to each helper call rather than its enclosing factory.
export type ViewFactory<S extends ObjectSchema, Meta, Rels> = <
  const R extends ResolveDepths = EmptyObject,
  Derived extends AugmentOutput = EmptyObject,
>(
  config: ViewConfig<S, Meta, Rels, R, Derived>,
) => NoInfer<
  DefinedView<
    ViewConfig<S, Meta, Rels, R, Derived> & { filter?: never; sort?: never },
    R
  >
>;

export type ViewDefinition = {
  readonly [QinoViewMarker]: true;
  resolveDepth: ResolveDepths;
  augment?: (entry: never) => Awaitable<AugmentOutput>;
};

export type ViewsConfig<
  Views,
  Factory,
  Definition = ViewDefinition & { filter?: never; sort?: never },
> = Views &
  ((view: Factory) => Record<string, Definition> & { default: Definition });

export type ConfiguredViews<Views extends object> = Views extends ((
  ...args: never[]
) => infer Result extends object)
  ? Result
  : object;

export type ViewNames<Views> = keyof Views & string;

// Capture the argument tuple so optional options include the default result.
export type ViewArguments<Views> = [
  options?: GetterOptions<ViewNames<Views> | undefined>,
];
export type ViewSelection<Options> =
  Options extends GetterOptions<string | undefined>
    ? "view" extends keyof Options
      ? Options["view"]
      : undefined
    : undefined;

export type SelectedView<S extends ObjectSchema, Meta, Rels, Views, Name> = (
  Name extends undefined
    ? "default"
    : Name
) extends infer Selected
  ? Selected extends keyof Views
    ? ViewEntry<
        S,
        Meta,
        Rels,
        Views[Selected] extends {
          resolveDepth: infer R extends ResolveDepths;
        }
          ? R
          : EmptyObject
      > &
        (Views[Selected] extends {
          augment?: (...args: never[]) => infer Output;
        }
          ? Awaited<Output>
          : object)
    : ViewEntry<S, Meta, Rels, EmptyObject>
  : never;

export type RootViewSettings = {
  resolveDepth?: never;
  augment?: never;
  filter?: never;
  sort?: never;
};
