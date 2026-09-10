import type { Simplify } from "type-fest";

import type { QinoViewMarker } from "../data";
import type { AugmentOutput, Awaitable, EntryAugment } from "./augment";
import type { MetaFieldName } from "./entry";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type { GetterOptions } from "./utils";

export type ViewEntry<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveOption,
> = Simplify<
  { [K in MetaFieldName]: Meta } & ResolveEntry<S, Rels, NormalizeDepth<R>>
>;

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
  Derived extends AugmentOutput = {},
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
  ((view: Factory) => Record<string, Definition> & { default?: never });

export type ConfiguredViews<Views extends object> = Views extends ((
  ...args: never[]
) => infer Result extends object)
  ? Result
  : object;

export type ViewNames<Views> = Exclude<keyof Views & string, "default">;

// Capture the argument tuple so optional options include the default result.
export type ViewArguments<Views> = [
  options?: GetterOptions<ViewNames<Views> | undefined>,
];
export type ViewSelection<Options> =
  Options extends GetterOptions<string | undefined>
    ? Options["view"]
    : undefined;

export type SelectedView<
  S extends ObjectSchema,
  Meta,
  Rels,
  DefaultR extends ResolveOption,
  Derived,
  Views,
  Name,
> = Name extends keyof Views
  ? ViewEntry<
      S,
      Meta,
      Rels,
      Views[Name] extends { resolveRelations: infer R extends ResolveOption }
        ? R
        : false
    > &
      (Views[Name] extends { augment?: (...args: never[]) => infer Output }
        ? Awaited<Output>
        : object)
  : ViewEntry<S, Meta, Rels, DefaultR> & Derived;
