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
  async function resolveDir() {
    const config = await getConfig();
    return nodePath.join(config.contentFolder, path);
  }

  function buildMeta(dir: string, relPath: string) {
    return {
      slug: relPath.slice(0, -extention.length),
      fileName: nodePath.basename(relPath),
      filePath: nodePath.join(dir, relPath),
    };
  }

  async function getAll() {
    const dir = await resolveDir();
    const relPaths = await fg(`**/*${extention}`, { cwd: dir });
    const entries = await Promise.all(
      relPaths.map(async (relPath) => ({
        _meta: buildMeta(dir, relPath),
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
    const dir = await resolveDir();
    const _meta = buildMeta(dir, `${slug}${extention}`);
    const data = await fs.readFile(_meta.filePath, "utf-8");

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
