import type { Simplify } from "type-fest";

import type { QinoViewMarker } from "../data/globals";
import type { AugmentOutput, Awaitable, EntryAugment } from "./augment";
import type { GeneratedFields } from "./generated-fields";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { EmptyObject, GetterOptions } from "./utils";

export type ViewEntry<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveOption,
> = Simplify<GeneratedFields<Meta> & ResolveEntry<S, Rels, NormalizeDepth<R>>>;

export type ViewConfig<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveOption,
  Derived extends AugmentOutput,
> = {
  resolveRelations?: R;
  augment?: EntryAugment<S, Meta, Derived, Rels, R>;
};

export type DefinedView<Config, R extends ResolveOption> = Config & {
  readonly [QinoViewMarker]: true;
  resolveRelations: R;
};

// Keep inference local to each helper call rather than its enclosing factory.
export type ViewFactory<S extends ObjectSchema, Meta, Rels> = <
  R extends ResolveOption = false,
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
  resolveRelations: ResolveOption;
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
          resolveRelations: infer R extends ResolveOption;
        }
          ? R
          : false
      > &
        (Views[Selected] extends {
          augment?: (...args: never[]) => infer Output;
        }
          ? Awaited<Output>
          : object)
    : ViewEntry<S, Meta, Rels, false>
  : never;

export type RootViewSettings = {
  resolveRelations?: never;
  augment?: never;
  filter?: never;
  sort?: never;
};
