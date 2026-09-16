import type { AugmentOutput } from "./augment";
import type { ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type {
  DefinedView,
  ViewConfig,
  ViewDefinition,
  ViewEntry,
} from "./views";

export type CollectionCallbacks<Entry> = {
  filter?: (entry: Readonly<Entry>) => boolean;
  sort?: (a: Readonly<Entry>, b: Readonly<Entry>) => number;
};

export type CollectionViewConfig<
  S extends ObjectSchema,
  Meta,
  Rels,
  R extends ResolveOption,
  Derived extends AugmentOutput,
> = ViewConfig<S, Meta, Rels, R, Derived> &
  CollectionCallbacks<ViewEntry<S, Meta, Rels, R> & NoInfer<Derived>>;

// Infer each helper call from its config, without the factory return context
// widening relation depth or augmented fields.
export type CollectionViewFactory<S extends ObjectSchema, Meta, Rels> = <
  R extends ResolveOption = false,
  Derived extends AugmentOutput = {},
>(
  config: CollectionViewConfig<S, Meta, Rels, R, Derived>,
) => NoInfer<DefinedView<CollectionViewConfig<S, Meta, Rels, R, Derived>, R>>;

export type CollectionViewDefinition = ViewDefinition &
  CollectionCallbacks<never>;
