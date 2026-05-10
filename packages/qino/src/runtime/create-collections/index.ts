import fs from "node:fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import type {
  Collection,
  CreateCollectionParams,
  ObjectSchema,
  SupportedFileExtension,
} from "../../types";
import { validate } from "../../lib/standard-schema";
import { QinoMeta } from "../symbols";
import { register } from "../registry";
import { buildMeta } from "./build-meta";
import { resolveCollectionDirectory } from "./resolve-collection-directory";

const CONTENT_FIELD_NAME = "markdown";

export function createCollection<
  S extends ObjectSchema,
  Ext extends SupportedFileExtension,
>({
  relativePath,
  schema,
  extension,
  relations = {},
}: CreateCollectionParams<S, Ext>) {
  async function getAll() {
    const collectionDirectory = await resolveCollectionDirectory(relativePath);

    const relFilePaths = await fg(`**/*${extension}`, {
      cwd: collectionDirectory,
    });

    const entries = await Promise.all(
      relFilePaths.map(async (relPath) => {
        const meta = buildMeta({
          directory: collectionDirectory,
          relativePath: relPath,
          extension,
        });

        const rawFileData = await fs.readFile(
          nodePath.join(collectionDirectory, relPath),
          "utf-8",
        );

        return {
          _meta: meta,
          raw: rawFileData,
        };
      }),
    );

    if (extension == ".json") {
      return entries.map(({ _meta, raw }) => {
        const parsed = JSON.parse(raw);

        return {
          _meta,
          ...validate(schema, parsed, _meta.filePath),
        };
      });
    }

    return entries.map(({ _meta, raw }) => {
      const parsed = matter(raw);

      return {
        _meta,
        ...validate(
          schema,
          { [CONTENT_FIELD_NAME]: parsed.content, ...parsed.data },
          _meta.filePath,
        ),
      };
    });
  }

  async function getOne(slug: string) {
    const collectionDirectory = await resolveCollectionDirectory(relativePath);

    const meta = buildMeta({
      directory: collectionDirectory,
      relativePath: `${slug}${extension}`,
      extension,
    });

    const data = await fs.readFile(meta.filePath, "utf-8");

    if (extension == ".json") {
      return {
        _meta: meta,
        ...validate(schema, JSON.parse(data), meta.filePath),
      };
    }

    const parsed = matter(data);
    return {
      _meta: meta,
      ...validate(
        schema,
        { [CONTENT_FIELD_NAME]: parsed.content, ...parsed.data },
        meta.filePath,
      ),
    };
  }

  const collection = {
    [QinoMeta]: {
      schema,
      path: relativePath,
      extension,
      relations,
    },
    getAll,
    getOne,
  } as const satisfies Collection<S, Ext>;

  register(collection);

  return collection;
}
