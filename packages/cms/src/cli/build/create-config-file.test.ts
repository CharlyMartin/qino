import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { version } from "../../../package.json";
import { QinoConfigMarker } from "../../data/globals";
import { initQino } from "../../runtime/qino/init-qino";
import { createConfigFile } from "./create-config-file";

const cwd = nodePath.resolve("/project");

beforeEach(() => {
  vi.spyOn(process, "cwd").mockReturnValue(cwd);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function setup() {
  const qino = initQino({
    contentFolder: "src/content",
    mediaFolder: "public",
    checkLocalAssetReferences: false,
    buildConfigFile: true,
  });
  const schema = z.object({ title: z.string() });

  return {
    context: qino[QinoConfigMarker],
    collections: [
      qino.defineCollection({ directory: "posts", schema, extension: ".md" }),
      qino.defineCollection({
        directory: "authors",
        schema,
        extension: ".json",
      }),
    ],
    items: [qino.defineItem({ file: "pages/home.md", schema })],
    trees: [
      qino.defineTree({
        directory: "docs",
        schema,
        extension: ".mdx",
        titleField: "title",
      }),
    ],
  };
}

describe("createConfigFile", () => {
  test("serializes a sorted, pretty-printed config", () => {
    const content = createConfigFile(setup());
    const json = JSON.parse(content);

    expect(content).toBe(`${JSON.stringify(json, null, 2)}\n`);
    expect(json).toMatchObject({
      version: 1,
      qinoVersion: version,
      config: { contentFolder: "src/content", mediaFolder: "public" },
    });
    expect(Object.keys(json.config)).toEqual(["contentFolder", "mediaFolder"]);
    expect(Object.keys(json.collections)).toEqual(["authors", "posts"]);
    expect(Object.keys(json.items)).toEqual(["pages/home.md"]);
    expect(Object.keys(json.trees)).toEqual(["docs"]);
  });

  test("is deterministic", () => {
    expect(createConfigFile(setup())).toBe(createConfigFile(setup()));
  });

  test("writes config folders relative to cwd", () => {
    const qino = initQino({
      contentFolder: nodePath.join(cwd, "content"),
      mediaFolder: nodePath.join(cwd, "..", "shared", "public"),
    });

    const json = JSON.parse(
      createConfigFile({ context: qino[QinoConfigMarker] }),
    );
    expect(json.config).toEqual({
      contentFolder: "content",
      mediaFolder: "../shared/public",
    });
  });

  test("writes empty sections without primitives", () => {
    const json = JSON.parse(createConfigFile({ context: setup().context }));

    expect(json).toMatchObject({ collections: {}, items: {}, trees: {} });
  });
});
