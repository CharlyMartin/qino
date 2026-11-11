import type { MarkdownExtension } from "./generated-fields";
import type {
  MarkdownTocFlag,
  MarkdownTocOption,
  MarkdownTocOptions,
} from "./markdown-toc";
import type { MediaRule } from "./media";

/**
 * Config for the Markdown body, the entry's `markdown` field. JSON files have
 * no body, so no `markdown`.
 */
export type MarkdownConfig<
  Stats extends boolean = boolean,
  Toc extends MarkdownTocFlag = MarkdownTocFlag,
> = {
  /** Adds `_stats` (word and character counts) from the body. */
  readonly stats?: Stats;
  /** Adds `_toc` (the headings, with their anchor ids) from the body. */
  // Infers `Toc` from booleans only: see `MarkdownTocFlag`.
  readonly toc?: Toc | NoInfer<MarkdownTocOptions>;
  /**
   * The files the body can embed, checked by `qino check`. With a list, an
   * image must match one rule, each read with its own `parse`.
   */
  readonly media?: MediaRule | ReadonlyArray<MediaRule>;
};

/** Flags `markdown` on JSON files, which have no body. */
export type CheckMarkdownConfig<Ext> = [Ext] extends [MarkdownExtension]
  ? unknown
  : { readonly "JSON files have no Markdown body": Ext };

/** `markdown` as stored on a primitive, with defaults and `media` as a list. */
export type ResolvedMarkdownConfig = {
  readonly stats: boolean;
  readonly toc: MarkdownTocOption;
  readonly media: ReadonlyArray<MediaRule>;
};
