import { readFile } from "node:fs/promises";

import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";

const ROOT = new URL("../../../../", import.meta.url);
// Every `export` statement, from its keyword to the end of the line.
const EXPORT_LINES = /^\s*export\b[^\n]*/gm;
// The forms the test reads: `export { a } from "…"` and
// `export type { A, B } from "…"`, over several lines.
const EXPORT_LISTS = /^export (type )?\{([^}]*)\}/gm;
// The names in a table row's first cell: `| [`A`, `B`](…) |`.
const TABLED_NAMES = /^\| \[([^\]]*)\]/gm;

// The name a list entry exports: `b` for `type a as b`, without comments.
function toExportedName(entry: string) {
  const name = entry
    .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
    .trim()
    .replace(/^type\s+/, "");
  return name.split(/\s+as\s+/).at(-1) ?? "";
}

// A function is documented by an API page titled with its name, such as
// `api/init-qino`, and a type by a row of the Types page's table, which says
// it lists every type.
test("every export of @qino/cms has an API page or a row in the Types table", async () => {
  const [index, nodes, { markdown: typesPage }] = await Promise.all([
    readFile(new URL("packages/cms/src/index.ts", ROOT), "utf8"),
    docsTree.getFlatTree(),
    docsTree.getEntry("api/types"),
  ]);
  // Pages directly under the API Reference, not its methods' or types' pages.
  const functionPages = new Set(
    nodes
      .filter(({ slug }) => /^api\/[^/]+$/.test(slug))
      .map(({ title }) => title),
  );
  const tabledTypes = new Set(
    [...typesPage.matchAll(TABLED_NAMES)].flatMap(([, cell = ""]) =>
      [...cell.matchAll(/`(\w+)`/g)].map(([, name]) => name),
    ),
  );

  // Any other form, such as `export *` or `export const`, can't be checked.
  const unread = [...index.matchAll(EXPORT_LINES)]
    .map(([line]) => line.trim())
    .filter((line) => !/^export (type )?\{/.test(line));

  const undocumented = [];
  let exportCount = 0;
  for (const [, isType, list = ""] of index.matchAll(EXPORT_LISTS)) {
    for (const entry of list.split(",")) {
      const name = toExportedName(entry);
      if (!name) continue;
      exportCount++;
      const isTypeEntry = isType || /^\s*type\s/.test(entry);
      if (!(isTypeEntry ? tabledTypes : functionPages).has(name)) {
        undocumented.push(name);
      }
    }
  }

  expect(unread).toEqual([]);
  expect(exportCount).toBeGreaterThan(0);
  expect(undocumented).toEqual([]);
});
