import type { Simplify } from "type-fest";

import type { AugmentOutput, Awaitable } from "./augment";
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

export type ViewAugment<Entry, Output extends AugmentOutput> = (
  entry: Readonly<Entry>,
) => Awaitable<Output & { [K in keyof Entry]?: never }>;

// Discriminate on depth so inline callbacks receive their contextual input type
// before TypeScript infers their return values through ViewsConfig.
export type ViewConfig<S extends ObjectSchema, Meta, Rels> =
  | {
      resolveRelations: true;
      augment?: ViewAugment<ViewEntry<S, Meta, Rels, true>, AugmentOutput>;
    }
  | {
      [R in Exclude<ResolveOption, boolean>]: {
        resolveRelations: R;
        augment?: ViewAugment<ViewEntry<S, Meta, Rels, R>, AugmentOutput>;
      };
    }[Exclude<ResolveOption, boolean>]
  | {
      resolveRelations?: false;
      augment?: ViewAugment<ViewEntry<S, Meta, Rels, false>, AugmentOutput>;
    };

export type ViewsConfig<S extends ObjectSchema, Meta, Rels, Views> = Views & {
  [K in keyof Views]: ViewConfig<S, Meta, Rels>;
} & { default?: never };

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
      (Views[Name] extends { augment: (...args: never[]) => infer Output }
        ? Awaited<Output>
        : object)
  : ViewEntry<S, Meta, Rels, DefaultR> & Derived;
