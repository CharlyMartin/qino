import type { AnyCollectionMeta, AnySingletonMeta } from "../../types";
import type { Slug } from "../../types/utils";
import { parseRelationValue } from "./parse-relation-value";

type Context = {
  relationKey: string;
  sourceFilePath: string;
  targetMeta: AnyCollectionMeta | AnySingletonMeta;
  resolveTargetReference: (slug: Slug) => Promise<Record<string, unknown>>;
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

  const slug = parseRelationValue(leaf, ctx.targetMeta, {
    sourceFilePath: ctx.sourceFilePath,
    relationKey: ctx.relationKey,
  });

  return ctx.resolveTargetReference(slug);
}
