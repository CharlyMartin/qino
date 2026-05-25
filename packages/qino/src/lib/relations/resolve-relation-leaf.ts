import type { AnyCollection, AnySingleton } from "../../types";
import type { ResolveCache } from "./create-resolve-cache";
import { fetchAndResolve } from "./fetch-and-resolve";
import { parseRelationValue } from "./parse-relation-value";

type Context = {
  relationKey: string;
  sourceFilePath: string;
  target: AnyCollection | AnySingleton;
  depth: number;
  cache: ResolveCache;
};

export async function resolveRelationLeaf(leaf: unknown, ctx: Context) {
  if (typeof leaf != "string") {
    throw new Error(
      `Expected string at relation "${ctx.relationKey}" in ${ctx.sourceFilePath}; got ${typeof leaf}.`,
    );
  }

  if (leaf == "") {
    throw new Error(
      `Empty relation reference at "${ctx.relationKey}" in ${ctx.sourceFilePath}.`,
    );
  }

  const slug = parseRelationValue(leaf, ctx.target, {
    sourceFilePath: ctx.sourceFilePath,
    relationKey: ctx.relationKey,
  });

  return fetchAndResolve(ctx.target, slug, ctx.depth, ctx.cache, {
    sourceFilePath: ctx.sourceFilePath,
    relationKey: ctx.relationKey,
  });
}
