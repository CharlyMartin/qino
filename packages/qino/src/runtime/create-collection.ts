import { ZodObject } from "zod";
import type { SupportedFileExtention } from "../types";
import fs from "fs/promises";
import nodePath from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";

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
  async function getAll() {
    const relPaths = await fg(`**/*${extention}`, { cwd: path });
    const dataList = await Promise.all(
      relPaths.map((relPath) =>
        fs.readFile(nodePath.join(path, relPath), "utf-8"),
      ),
    );

    if (extention == ".json") {
      return dataList.map((data) => {
        const parsed = JSON.parse(data);
        return schema.parse(parsed);
      });
    }

    return dataList.map((data) => {
      const parsed = matter(data);
      return schema.parse({ markdown: parsed.content, ...parsed.data });
    });
  }

  async function getOne(slug: string) {
    const data = await fs.readFile(
      nodePath.join(path, `${slug}${extention}`),
      "utf-8",
    );

    if (extention == ".json") {
      const parsed = JSON.parse(data);
      return schema.parse(parsed);
    }

    const parsed = matter(data);
    return schema.parse({ markdown: parsed.content, ...parsed.data });
  }

  return {
    getAll,
    getOne,
  };
}
