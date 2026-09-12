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
import type { ObjectSchema, ValidatedOutput } from "./schema";
import type { SlugFor } from "./slug-registry";
import type {
  GenericPath,
  GetterOptions,
  Slug,
  SupportedFileExtension,
} from "./utils";
import type { SelectedView, ViewArguments, ViewSelection } from "./views";

export type TreeEntryMeta<
  Ext extends SupportedFileExtension = SupportedFileExtension,
> = {
  slug: Slug;
  fileName: `${string}${Ext}`;
  filePath: `${string}${Ext}`;
};

export type StringKeys<Schema extends ObjectSchema> = {
  [K in keyof ValidatedOutput<Schema> &
    string]: ValidatedOutput<Schema>[K] extends string ? K : never;
}[keyof ValidatedOutput<Schema> & string];

export type TreeNode = {
  slug: Slug;
  title: string;
  fileName: string;
  filePath: string;
  children: Array<TreeNode>;
};

export type TreeMeta<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension = SupportedFileExtension,
  Title extends StringKeys<Schema> = StringKeys<Schema>,
  Rels extends Relations<Schema> = Relations<Schema>,
> = {
  readonly is: (typeof QinoPrimitives)["tree"];
  readonly instanceId: symbol;
  readonly schema: Schema;
  readonly directory: GenericPath;
  readonly extension: Ext;
  readonly titleField: Title;
  readonly orderFileName: string;
  readonly relations: Rels;
  readonly resolveRelations: ResolveOption;
  readonly readEntry: (
    slug: Slug,
  ) => Promise<ResolvedTreeEntry<Schema, Ext, Rels, false>>;
};

export type Tree<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Title extends StringKeys<Schema>,
  Rels extends Relations<Schema> = object,
  DefaultR extends ResolveOption = false,
  Dir extends GenericPath = GenericPath,
  Derived extends AugmentOutput = {},
  Views extends object = object,
> = PrimitiveInference<
  Schema,
  TreeEntryMeta<Ext>,
  Rels,
  DefaultR,
  Derived,
  Views
> & {
  readonly [QinoPrimitiveMarker]: TreeMeta<Schema, Ext, Title, Rels>;
  getTree(): Promise<Array<TreeNode>>;
  getTree(slug: SlugFor<Dir>): Promise<TreeNode>;
  getFlatTree(): Promise<Array<TreeNode>>;
  getEntry<Args extends ViewArguments<Views> = []>(
    slug: SlugFor<Dir>,
    ...args: Args
  ): Promise<
    SelectedView<
      Schema,
      TreeEntryMeta<Ext>,
      Rels,
      DefaultR,
      Derived,
      Views,
      ViewSelection<Args[0]>
    >
  >;
  getNextNode(slug: SlugFor<Dir>): Promise<TreeNode | null>;
  getPreviousNode(slug: SlugFor<Dir>): Promise<TreeNode | null>;
};

export type ResolvedTreeEntry<
  Schema extends ObjectSchema,
  Ext extends SupportedFileExtension,
  Rels extends Relations<Schema>,
  R extends ResolveOption,
  Derived extends AugmentOutput = {},
> = Simplify<
  { [K in typeof META_FIELD_NAME]: TreeEntryMeta<Ext> } & ResolveEntry<
    Schema,
    Rels,
    NormalizeDepth<R>
  > &
    Derived
>;

// Check types
export type AnyTreeMeta = {
  readonly is: (typeof QinoPrimitives)["tree"];
  readonly instanceId: symbol;
  readonly schema: ObjectSchema;
  readonly directory: GenericPath;
  readonly extension: SupportedFileExtension;
  readonly titleField: string;
  readonly orderFileName: string;
  readonly relations: Relations<ObjectSchema>;
  readonly resolveRelations: ResolveOption;
  readonly readEntry: (
    slug: Slug,
  ) => Promise<
    Record<string, unknown> & { [K in typeof META_FIELD_NAME]: TreeEntryMeta }
  >;
};

export type AnyTree = {
  readonly [QinoPrimitiveMarker]: AnyTreeMeta;
  getTree(): Promise<Array<TreeNode>>;
  getTree(slug: Slug): Promise<TreeNode>;
  getFlatTree(): Promise<Array<TreeNode>>;
  getEntry(
    slug: Slug,
    options?: GetterOptions<undefined>,
  ): Promise<
    Record<string, unknown> & { [K in typeof META_FIELD_NAME]: TreeEntryMeta }
  >;
  getNextNode(slug: Slug): Promise<TreeNode | null>;
  getPreviousNode(slug: Slug): Promise<TreeNode | null>;
};
