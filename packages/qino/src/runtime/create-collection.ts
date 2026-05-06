import { ZodObject } from "zod";
import type { SupportedFileExtention } from "../types";
import fs from "fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { getConfig } from "./load-config";

export type Collection<Schema extends ZodObject> = {
  path: string;
  schema: Schema;
  extention: SupportedFileExtention;
  //   relation: Record<keyof Schema, string>; // The idea is
};

export function createCollection<Schema extends ZodObject>({
  path,
  schema,
  extention,
}: Collection<Schema>) {
  function resolveDir() {
    return nodePath.join(getConfig().contentFolder, path);
  }

  function buildMeta(relPath: string) {
    return {
      slug: relPath.slice(0, -extention.length),
      filename: nodePath.basename(relPath),
      path: nodePath.join(resolveDir(), relPath),
    };
  }

  async function getAll() {
    const dir = resolveDir();
    const relPaths = await fg(`**/*${extention}`, { cwd: dir });
    const entries = await Promise.all(
      relPaths.map(async (relPath) => ({
        _meta: buildMeta(relPath),
        raw: await fs.readFile(nodePath.join(dir, relPath), "utf-8"),
      })),
    );

    if (extention == ".json") {
      return entries.map(({ _meta, raw }) => ({
        _meta,
        ...schema.parse(JSON.parse(raw)),
      }));
    }

    return entries.map(({ _meta, raw }) => {
      const parsed = matter(raw);
      return {
        _meta,
        ...schema.parse({ markdown: parsed.content, ...parsed.data }),
      };
    });
  }

  async function getOne(slug: string) {
    const _meta = buildMeta(`${slug}${extention}`);
    const data = await fs.readFile(_meta.path, "utf-8");

    if (extention == ".json") {
      const parsed = JSON.parse(data);
      return { _meta, ...schema.parse(parsed) };
    }

    const parsed = matter(data);
    return {
      _meta,
      ...schema.parse({ markdown: parsed.content, ...parsed.data }),
    };
  }

  return {
    getAll,
    getOne,
  };
}
