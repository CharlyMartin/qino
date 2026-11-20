import fs from "node:fs/promises";
import nodePath from "node:path";

import { consola } from "consola";

import {
  DEFAULT_LLMS_TXT_TEMPLATE,
  INDEX_MD_FILE_NAME,
  LLMS_TXT_FILE_NAME,
  QinoPrimitiveMarker,
} from "../../data/globals";
import { formatListingSection } from "../../lib/agent-markdown/format-listing-section";
import { isFile } from "../../lib/fs/is-file";
import { readTextFile } from "../../lib/fs/read-text-file";
import type { QinoContext } from "../../runtime/qino/init-qino";
import type { AnyCollection } from "../../types/collection";
import type { AnyItem } from "../../types/item";
import type { AnyTree } from "../../types/tree";
import { collectLlmsTxtSections } from "./collect-llms-txt-sections";
import { insertLlmsTxtSections } from "./insert-llms-txt-sections";

type WriteLlmsTxtParams = {
  context: QinoContext;
  collections: Array<AnyCollection>;
  items: Array<AnyItem>;
  trees: Array<AnyTree>;
};

/**
 * With `cli.build.llmsTxt` on, writes `llms.txt` and `index.md`, the same
 * file, at the root of `mediaFolder`. `index.md` is left out when a primitive
 * puts a page at the site root, which owns `/index.md`.
 */
export async function writeLlmsTxt({
  context,
  collections,
  items,
  trees,
}: WriteLlmsTxtParams) {
  const option = context.cli?.build?.llmsTxt;
  if (!option) return;
  if (!context.siteUrl) {
    throw new Error(
      '`cli.build.llmsTxt` needs a siteUrl: set one in initQino, such as "https://example.com".',
    );
  }

  const templatePath = nodePath.join(
    context.contentFolder,
    (typeof option == "object" && option.template) || DEFAULT_LLMS_TXT_TEMPLATE,
  );
  if (!(await isFile(templatePath))) {
    throw new Error(
      `The llms.txt template "${templatePath}" doesn't exist. Create it with your site's title, summary and "When to use" section, or set \`cli.build.llmsTxt.template\`.`,
    );
  }

  const sections = await collectLlmsTxtSections({ collections, items, trees });
  const llmsTxt = insertLlmsTxtSections(
    await readTextFile(templatePath),
    sections.map(formatListingSection).join("\n\n"),
  );
  const claimsSiteRoot =
    [...collections, ...trees].some(
      (primitive) => primitive[QinoPrimitiveMarker].pages?.index == "/",
    ) || items.some((item) => item[QinoPrimitiveMarker].page?.page == "/");

  const files = claimsSiteRoot
    ? [LLMS_TXT_FILE_NAME]
    : [LLMS_TXT_FILE_NAME, INDEX_MD_FILE_NAME];
  await fs.mkdir(context.mediaFolder, { recursive: true });
  for (const file of files) {
    await fs.writeFile(nodePath.join(context.mediaFolder, file), llmsTxt);
  }

  const written = files.map((file) => nodePath.join(context.mediaFolder, file));
  consola.success(`Wrote ${written.join(" and ")}.`);
  if (claimsSiteRoot) {
    consola.info(
      `${INDEX_MD_FILE_NAME} skipped: a primitive's page is the site root, which serves /index.md.`,
    );
  }
}
