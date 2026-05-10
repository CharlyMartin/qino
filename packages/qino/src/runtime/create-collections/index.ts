import { ZodObject } from "zod";
import type { SupportedFileExtension } from "../../types";
import fs from "fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { buildMeta } from "./build-meta";
import { resolveCollectionDirectory } from "./resolve-collection-directory";

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
  async function getAll() {
    const collectionDirectory = await resolveCollectionDirectory(path);

    const relPaths = await fg(`**/*${extension}`, { cwd: collectionDirectory });

    const entries = await Promise.all(
      relPaths.map(async (relPath) => {
        const meta = buildMeta({
          directory: collectionDirectory,
          relativePath: relPath,
          extension,
        });

        return {
          _meta: meta,
          raw: await fs.readFile(
            nodePath.join(collectionDirectory, relPath),
            "utf-8",
          ),
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
    const collectionDirectory = await resolveCollectionDirectory(path);

    const meta = buildMeta({
      directory: collectionDirectory,
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
