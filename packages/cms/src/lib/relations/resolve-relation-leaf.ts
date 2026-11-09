import type { RelationParse } from "../../types/relations";
import type { AnyPrimitiveMeta, Slug } from "../../types/utils";
import { applyParse } from "../parse/apply-parse";
import { parseRelationValue } from "./parse-relation-value";
import { toRelationParseTarget } from "./to-relation-parse-target";

type Context = {
  relationKey: string;
  sourceFilePath: string;
  targetMeta: AnyPrimitiveMeta;
  parse?: RelationParse;
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

  const value = applyParse({
    value: leaf,
    parse: ctx.parse,
    ctx: {
      filePath: ctx.sourceFilePath,
      path: ctx.relationKey,
      target: toRelationParseTarget(ctx.targetMeta),
    },
    owner: `Relation "${ctx.relationKey}" in ${ctx.sourceFilePath}`,
  });

  const slug = parseRelationValue(value, ctx.targetMeta, {
    sourceFilePath: ctx.sourceFilePath,
    relationKey: ctx.relationKey,
    parsedFrom: value == leaf ? undefined : leaf,
  });

  return ctx.resolveTargetReference(slug);
}
