import { MARKDOWN_HEADING_TAGS } from "../../data/globals";
import type {
  MarkdownConfig,
  ResolvedMarkdownConfig,
} from "../../types/markdown-config";
import type { MediaRule } from "../../types/media";

type ResolveMarkdownConfigParams = {
  markdown: MarkdownConfig | undefined;
  extension: string;
  primitiveId: string;
};

/**
 * Applies `markdown`'s defaults and lists `media` as rules. Fails at
 * definition on `markdown` for JSON files, which have no body, on a `toc.upTo`
 * that isn't a heading tag, and on a `toc.slug` or a rule's `parse` that isn't
 * a function. Types and sizes are checked by `qino build` and `qino check`.
 */
export function resolveMarkdownConfig({
  markdown,
  extension,
  primitiveId,
}: ResolveMarkdownConfigParams): ResolvedMarkdownConfig {
  if (markdown == undefined) return { stats: false, toc: false, media: [] };

  const prefix = `markdown of "${primitiveId}"`;

  if (extension == ".json") {
    throw new Error(
      `${prefix} configures the Markdown body, but JSON files have none.`,
    );
  }

  if (typeof markdown != "object") {
    throw new Error(`${prefix} must be an object, got ${typeof markdown}.`);
  }

  const { stats = false, toc = false, media = [] } = markdown;
  // `Toc`'s options marker types no value: what's passed is an option.
  assertToc(toc as ResolvedMarkdownConfig["toc"], primitiveId);

  const rules: ReadonlyArray<MediaRule> = Array.isArray(media)
    ? media
    : [media as MediaRule];
  rules.forEach((rule, index) => {
    const { parse } = rule as { parse?: unknown };
    if (parse != null && typeof parse != "function") {
      const owner = Array.isArray(media)
        ? `markdown.media, rule ${index + 1}, parse`
        : "markdown.media.parse";
      throw new Error(
        `${owner} of "${primitiveId}" must be a function, got ${typeof parse}.`,
      );
    }
  });

  return {
    stats,
    toc: toc as ResolvedMarkdownConfig["toc"],
    media: rules,
  };
}

function assertToc(toc: ResolvedMarkdownConfig["toc"], primitiveId: string) {
  if (typeof toc != "object") return;
  const { upTo, slug } = toc;

  const tags: readonly (string | undefined)[] = [
    ...MARKDOWN_HEADING_TAGS,
    undefined,
  ];
  if (!tags.includes(upTo)) {
    throw new Error(
      `markdown.toc.upTo of "${primitiveId}" must be one of ${MARKDOWN_HEADING_TAGS.join(", ")}, got ${JSON.stringify(upTo)}.`,
    );
  }

  if (slug != null && typeof slug != "function") {
    throw new Error(
      `markdown.toc.slug of "${primitiveId}" must be a function, got ${typeof slug}.`,
    );
  }
}
