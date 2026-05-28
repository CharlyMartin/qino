import type { Simplify } from "type-fest";

import type { QinoMeta } from "../data";
import type { SingletonEntryMeta } from "./entry";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema } from "./schema";
import type {
  GenericPath,
  GetterOptions,
  SupportedFileExtension,
} from "./utils";

export type SingletonMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: "singleton";
  readonly schema: Schema;
  readonly file: GenericPath;
  readonly extension: Ext;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type AnySingleton = {
  readonly [QinoMeta]: SingletonMeta<ObjectSchema>;
  getData(options?: GetterOptions): Promise<
    Record<string, unknown> & {
      _meta: SingletonEntryMeta<SupportedFileExtension>;
    }
  >;
};

export type AnySingletonMeta = AnySingleton[typeof QinoMeta];

export type Singleton<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  readonly [QinoMeta]: SingletonMeta<Schema, Ext, Rels>;
  getData<R extends ResolveOption = DefaultR>(
    options?: GetterOptions<R>,
  ): Promise<ResolvedSingletonView<Schema, Ext, Rels, R>>;
};

export type SingletonFile = {
  [Ext in SupportedFileExtension]: `${GenericPath}${Ext}`;
}[SupportedFileExtension];

export type ExtractSingletonExtension<F extends string> =
  F extends `${string}.json`
    ? ".json"
    : F extends `${string}.mdx`
      ? ".mdx"
      : F extends `${string}.markdown`
        ? ".markdown"
        : F extends `${string}.md`
          ? ".md"
          : never;

export type ResolvedSingletonView<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
> = Simplify<
  { _meta: SingletonEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  >
>;
