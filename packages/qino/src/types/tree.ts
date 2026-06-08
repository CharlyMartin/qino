import type { Simplify } from "type-fest";

import type { QinoMeta, QinoPrimitives } from "../data";
import type { QinoConfig } from "../runtime/qino/create-qino";
import type { MetaFieldName, TreeEntryMeta } from "./entry";
import type { Relations } from "./relations";
import type { NormalizeDepth, ResolveEntry, ResolveOption } from "./resolve";
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type {
  GenericPath,
  GetterOptions,
  SupportedFileExtension,
} from "./utils";

export type StringKeys<Schema extends ObjectSchema> = {
  [K in keyof ValidatedOutput<Schema> &
    string]: ValidatedOutput<Schema>[K] extends string ? K : never;
}[keyof ValidatedOutput<Schema> & string];

export type NodeTree = {
  slug: string;
  title: string;
  fileName: string;
  filePath: string;
  children: Array<NodeTree>;
};

export type TreeMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Title extends StringKeys<Schema> = StringKeys<Schema>,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["tree"];
  readonly instanceId: symbol;
  readonly config: QinoConfig;
  readonly schema: Schema;
  readonly directory: GenericPath;
  readonly extension: Ext;
  readonly titleField: Title;
  readonly orderFileName: string;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
};

export type TreeNodeLike = { [K in MetaFieldName]: { slug: string } };

export type Tree<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<Schema>,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = true,
> = {
  readonly [QinoMeta]: TreeMeta<Schema, Ext, Title, Rels>;
  getTree(): Promise<Array<NodeTree>>;
  getTree(slug: string): Promise<NodeTree>;
  getNodes(): Promise<Array<NodeTree>>;
  getEntry<R extends ResolveOption = DefaultR>(
    slug: string,
    options?: GetterOptions<R>,
  ): Promise<ResolvedTreeEntry<Schema, Ext, Rels, R>>;
  getNextNode(entryOrSlug: string | TreeNodeLike): Promise<NodeTree | null>;
  getPreviousNode(entryOrSlug: string | TreeNodeLike): Promise<NodeTree | null>;
};

export type ResolvedTreeEntry<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
> = Simplify<
  { [K in MetaFieldName]: TreeEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  >
>;

export type AnyTreeMeta = {
  readonly is: (typeof QinoPrimitives)["tree"];
  readonly instanceId: symbol;
  readonly config: QinoConfig;
  readonly schema: ObjectSchema;
  readonly directory: GenericPath;
  readonly extension: SupportedFileExtension;
  readonly titleField: string;
  readonly orderFileName: string;
  readonly relations: Relations<ObjectSchema>;
  readonly resolveRelations: ResolveOption;
};

export type AnyTree = {
  readonly [QinoMeta]: AnyTreeMeta;
  getTree(): Promise<Array<NodeTree>>;
  getTree(slug: string): Promise<NodeTree>;
  getNodes(): Promise<Array<NodeTree>>;
  getEntry(
    slug: string,
    options?: GetterOptions,
  ): Promise<
    Record<string, unknown> & {
      [K in MetaFieldName]: TreeEntryMeta<SupportedFileExtension>;
    }
  >;
  getNextNode(entryOrSlug: string | TreeNodeLike): Promise<NodeTree | null>;
  getPreviousNode(entryOrSlug: string | TreeNodeLike): Promise<NodeTree | null>;
};
