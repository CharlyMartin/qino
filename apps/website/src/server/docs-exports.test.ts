import { readFile } from "node:fs/promises";

import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";

const ROOT = new URL("../../../../", import.meta.url);
// `export { a } from "…"` and `export type { A, B } from "…"`.
const EXPORTS = /^export (type )?\{([^}]*)\}/gm;
// The names in a table row's first cell: `| [`A`, `B`](…) |`.
const TABLED_NAMES = /^\| \[([^\]]*)\]/gm;

// A function is documented by an API page titled with its name, and a type
// by a row of the Types page's table, which says it lists every type.
test("every export of @qino/cms has an API page or a row in the Types table", async () => {
  const [index, nodes, { markdown: typesPage }] = await Promise.all([
    readFile(new URL("packages/cms/src/index.ts", ROOT), "utf8"),
    docsTree.getFlatTree(),
    docsTree.getEntry("api/types"),
  ]);
  const apiTitles = new Set(
    nodes
      .filter(({ slug }) => slug.startsWith("api/"))
      .map(({ title }) => title),
  );
  const tabledTypes = new Set(
    [...typesPage.matchAll(TABLED_NAMES)].flatMap(([, cell = ""]) =>
      [...cell.matchAll(/`(\w+)`/g)].map(([, name]) => name),
    ),
  );

  const undocumented = [];
  let exports = 0;
  for (const [, isType, list = ""] of index.matchAll(EXPORTS)) {
    for (const name of list.split(",").map((part) => part.trim())) {
      if (!name) continue;
      exports++;
      if (!(isType ? tabledTypes : apiTitles).has(name))
        undocumented.push(name);
    }
  }

  expect(exports).toBeGreaterThan(0);
  expect(undocumented).toEqual([]);
});
