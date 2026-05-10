import { ZodObject } from "zod";
import type { SupportedFileExtension } from "../../types";
import fs from "fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { getConfig } from "../load-config";
import { buildMeta } from "./build-meta";

export type Collection<Schema extends ZodObject> = {
  path: string;
  schema: Schema;
  extension: SupportedFileExtension;
};

export function createCollection<Schema extends ZodObject>({
  path,
  schema,
  extension,
}: Collection<Schema>) {
  async function resolveDir() {
    const config = await getConfig();
    return nodePath.join(config.contentFolder, path);
  }

  async function getAll() {
    const dir = await resolveDir();
    const relPaths = await fg(`**/*${extension}`, { cwd: dir });

    const entries = await Promise.all(
      relPaths.map(async (relPath) => {
        const meta = buildMeta({
          directory: dir,
          relativePath: relPath,
          extension,
        });

        return {
          _meta: meta,
          raw: await fs.readFile(nodePath.join(dir, relPath), "utf-8"),
        };
      }),
    );

    if (extension == ".json") {
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
    const meta = buildMeta({
      directory: dir,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const data = await fs.readFile(meta.filePath, "utf-8");

    if (extension == ".json") {
      const parsed = JSON.parse(data);
      return { _meta: meta, ...schema.parse(parsed) };
    }

    const parsed = matter(data);
    return {
      _meta: meta,
      ...schema.parse({ markdown: parsed.content, ...parsed.data }),
    };
  }

  return {
    getAll,
    getOne,
  };
}
