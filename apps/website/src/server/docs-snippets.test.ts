import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

import { docsTree } from "../../qino/docs";

const ROOT = new URL("../../../../", import.meta.url);
// A fenced code block's info string and code.
const FENCES = /^```([^\n]*)\n([\s\S]*?)^```$/gm;
// The repository file a snippet quotes, such as
// ```ts title="src/start.ts" source="apps/website/src/start.ts"
const SOURCE = /\bsource="([^"]+)"/;

// Code lines, trimmed, without blank or comment-only ones.
function toCodeLines(code: string) {
  return code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^(\/\/|\/\*|\*)/.test(line));
}

// A snippet may leave lines and comments out, but its code lines are its
// source's, in the same order: a copy that drifts fails.
test("every snippet with a source quotes that file's code, in order", async () => {
  const nodes = await docsTree.getFlatTree();
  const drifts = [];
  let quotes = 0;
  for (const { slug } of nodes) {
    const { markdown } = await docsTree.getEntry(slug);
    for (const [, info = "", code = ""] of markdown.matchAll(FENCES)) {
      const source = info.match(SOURCE)?.[1];
      if (!source) continue;

      quotes++;
      const sourceLines = toCodeLines(
        await readFile(new URL(source, ROOT), "utf8"),
      );
      let next = 0;
      for (const line of toCodeLines(code)) {
        const found = sourceLines.indexOf(line, next);
        if (found == -1) {
          drifts.push(`${slug} quotes ${source}: ${line}`);
          break;
        }
        next = found + 1;
      }
    }
  }
  expect(quotes).toBeGreaterThan(0);
  expect(drifts).toEqual([]);
});

test("the CLI guide's usage block is the CLI's own", async () => {
  const { markdown } = await docsTree.getEntry("guide/cli");
  const block = [...markdown.matchAll(FENCES)]
    .map(([, , code = ""]) => code)
    .find((code) => code.startsWith("Usage: qino"));
  const cli = fileURLToPath(new URL("packages/cms/dist/cli.mjs", ROOT));
  // Without a command, it prints its usage as an error.
  const { stderr } = spawnSync(process.execPath, [cli], { encoding: "utf8" });

  expect(stderr.slice(stderr.indexOf("Usage:")).trimEnd()).toBe(
    block?.trimEnd(),
  );
});
