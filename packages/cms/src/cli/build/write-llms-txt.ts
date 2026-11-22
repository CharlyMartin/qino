import nodePath from "node:path";

import { consola } from "consola";

import {
  DEFAULT_LLMS_TXT_TEMPLATE_FILE_NAME,
  INDEX_MD_FILE_NAME,
  LLMS_FULL_TXT_FILE_NAME,
  LLMS_TXT_FILE_NAME,
  QinoPrimitiveMarker,
} from "../../data/globals";
import { formatListingSection } from "../../lib/agent-markdown/format-listing-section";
import { isFile } from "../../lib/fs/is-file";
import { readTextFile } from "../../lib/fs/read-text-file";
import { toMarkdownUrl } from "../../lib/pages/to-markdown-url";
import { toPagesMarkdownUrl } from "../../lib/pages/to-pages-markdown-url";
import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { buildIndexMd } from "./build-index-md";
import { buildLlmsFullTxt } from "./build-llms-full-txt";
import { collectLlmsFullDocuments } from "./collect-llms-full-documents";
import { collectLlmsTxtSections } from "./collect-llms-txt-sections";
import { collectSectionLlmsTxts } from "./collect-section-llms-txts";
import { insertLlmsTxtSections } from "./insert-llms-txt-sections";
import { writeGeneratedFile } from "./write-generated-file";

type WriteLlmsTxtParams = {
  context: QinoContext;
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

/**
 * Writes `llms.txt`, `llms-full.txt` and `index.md`, which is `llms.txt` after
 * a frontmatter block, at the root of `mediaFolder`, each only when it
 * changed. `index.md` is left out when a page's Markdown URL is `/index.md`,
 * which that page owns. With `sections`, it also writes each section
 * llms.txt, at its index page's path.
 */
export async function writeLlmsTxt({
  context,
  collections,
  items,
  trees,
}: WriteLlmsTxtParams) {
  const { siteUrl, mediaFolder } = context;
  if (!siteUrl) {
    throw new Error(
      '`cli.build.llmsTxt` needs a siteUrl: set one in initQino, such as "https://example.com".',
    );
  }

  const option = context.cli?.build?.llmsTxt;
  const templatePath = nodePath.join(
    context.contentFolder,
    (typeof option == "object" && option.template) ||
      DEFAULT_LLMS_TXT_TEMPLATE_FILE_NAME,
  );
  if (!(await isFile(templatePath))) {
    throw new Error(
      `The llms.txt template "${templatePath}" doesn't exist. Create it with your site's title, summary and "When to use" section, or set \`cli.build.llmsTxt.template\`.`,
    );
  }

  const template = await readTextFile(templatePath);
  const [sections, documents, sectionLlmsTxts] = await Promise.all([
    collectLlmsTxtSections({ collections, items, trees }),
    collectLlmsFullDocuments({ collections, items, trees }),
    typeof option == "object" && option.sections
      ? collectSectionLlmsTxts({ collections, trees })
      : undefined,
  ]);
  // With section llms.txt files, `llms.txt` links to them in place of the
  // trees' and collections' sections, and keeps the items' `## Pages`.
  const llmsTxtSections = sectionLlmsTxts
    ? [
        ...(sectionLlmsTxts.length > 0
          ? [
              {
                title: "Sections",
                links: sectionLlmsTxts.map(({ link }) => link),
              },
            ]
          : []),
        ...(await collectLlmsTxtSections({
          collections: [],
          items,
          trees: [],
        })),
      ]
    : sections;
  const llmsTxt = insertLlmsTxtSections({
    template,
    sections: llmsTxtSections.map(formatListingSection).join("\n\n"),
  });
  const llmsFullTxt = buildLlmsFullTxt({ template, documents });

  // Entry pages and items are in the sections, even when `llms.txt` links to
  // section llms.txt files instead; index pages aren't.
  const markdownUrls = [
    ...sections.flatMap((section) => section.links.map((link) => link.url)),
    ...[...collections, ...trees].flatMap((primitive) => {
      const pages = primitive[QinoPrimitiveMarker].pages;
      return pages ? [toPagesMarkdownUrl(pages)] : [];
    }),
  ];
  const indexMdIsTaken = markdownUrls.includes(toMarkdownUrl("/", siteUrl));
  const indexMdPath = nodePath.join(mediaFolder, INDEX_MD_FILE_NAME);

  const files = {
    [LLMS_TXT_FILE_NAME]: llmsTxt,
    [LLMS_FULL_TXT_FILE_NAME]: llmsFullTxt,
    ...(!indexMdIsTaken && {
      [INDEX_MD_FILE_NAME]: buildIndexMd({ template, llmsTxt, siteUrl }),
    }),
    ...Object.fromEntries(
      (sectionLlmsTxts ?? []).map(({ path, content }) => [path, content]),
    ),
  };
  const written = [];
  for (const [file, content] of Object.entries(files)) {
    const filePath = nodePath.join(mediaFolder, file);
    if (await writeGeneratedFile(filePath, content)) written.push(filePath);
  }
  if (written.length > 0) {
    consola.success(`Wrote ${new Intl.ListFormat("en-GB").format(written)}.`);
  }

  if (indexMdIsTaken) {
    consola.info(
      `${INDEX_MD_FILE_NAME} skipped: a page's Markdown URL is /index.md.`,
    );
    if (await isFile(indexMdPath)) {
      consola.warn(
        `"${indexMdPath}" hides that page's Markdown. Delete it: qino build no longer writes it.`,
      );
    }
  }
}
