import type { Simplify } from "type-fest";

import type {
  META_FIELD_NAME,
  QinoPrimitiveMarker,
  QinoPrimitives,
} from "../data";
import type { AugmentOutput } from "./augment";
import type { PrimitiveInference } from "./infer";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type {
  GenericPath,
  GetterOptions,
  SupportedFileExtension,
} from "./utils";
import type { SelectedView, ViewArguments, ViewSelection } from "./views";

export type ItemEntryMeta<
  Ext extends SupportedFileExtension = SupportedFileExtension,
> = {
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type ItemMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["item"];
  readonly instanceId: symbol;
  readonly schema: Schema;
  readonly file: GenericPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
  readonly readData: () => Promise<ResolvedItemView<Schema, Ext, Rels, false>>;
};

export type AnyItem = {
  readonly [QinoPrimitiveMarker]: ItemMeta<ObjectSchema>;
  getData(options?: GetterOptions<undefined>): Promise<
    Record<string, unknown> & {
      [K in typeof META_FIELD_NAME]: ItemEntryMeta;
    }
  >;
};

export type AnyItemMeta = AnyItem[typeof QinoPrimitiveMarker];

export type Item<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  Views extends object = object,
> = PrimitiveInference<Schema, ItemEntryMeta<Ext>, Rels, Views> & {
  readonly [QinoPrimitiveMarker]: ItemMeta<Schema, Ext, Rels>;
  getData<Args extends ViewArguments<Views> = []>(
    ...args: Args
  ): Promise<
    SelectedView<
      Schema,
      ItemEntryMeta<Ext>,
      Rels,
      Views,
      ViewSelection<Args[0]>
    >
  >;
};

export type ItemFile = {
  [Ext in SupportedFileExtension]: `${GenericPath}${Ext}`;
}[SupportedFileExtension];

export type ExtractItemExtension<F extends string> = F extends `${string}.json`
  ? ".json"
  : F extends `${string}.mdx`
    ? ".mdx"
    : F extends `${string}.markdown`
      ? ".markdown"
      : F extends `${string}.md`
        ? ".md"
        : never;

export type ResolvedItemView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
  Derived extends AugmentOutput = {},
> = Simplify<
  { [K in typeof META_FIELD_NAME]: ItemEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  > &
    Derived
>;
