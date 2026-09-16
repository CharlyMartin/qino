import type {
  AnyEntry,
  CollectionEntryMeta,
  ItemEntryMeta,
  TreeEntryMeta,
} from "@qino/cms";
import { expectTypeOf, test } from "vitest";

import { META_FIELD_NAME } from "../data/globals";

test("public metadata types preserve extension-specific fields", () => {
  expectTypeOf<CollectionEntryMeta<".md">>().toEqualTypeOf<{
    slug: string;
    fileName: `${string}.md`;
    filePath: `${string}.md`;
  }>();
  expectTypeOf<ItemEntryMeta<".json">>().toEqualTypeOf<{
    fileName: `${string}.json`;
    filePath: `${string}.json`;
  }>();
  expectTypeOf<TreeEntryMeta<".mdx">>().toEqualTypeOf<{
    slug: string;
    fileName: `${string}.mdx`;
    filePath: `${string}.mdx`;
  }>();
});

test("AnyEntry accepts each primitive entry and requires file metadata", () => {
  expectTypeOf<{
    title: string;
    [META_FIELD_NAME]: CollectionEntryMeta<".md">;
  }>().toExtend<AnyEntry>();
  expectTypeOf<{
    title: string;
    [META_FIELD_NAME]: ItemEntryMeta<".json">;
  }>().toExtend<AnyEntry>();
  expectTypeOf<{
    title: string;
    [META_FIELD_NAME]: TreeEntryMeta<".mdx">;
  }>().toExtend<AnyEntry>();
  expectTypeOf<{ title: string }>().not.toExtend<AnyEntry>();
  expectTypeOf<{
    _meta: { fileName: "entry.txt"; filePath: "/entry.txt" };
  }>().not.toExtend<AnyEntry>();
});
