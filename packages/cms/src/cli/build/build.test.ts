import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { QinoConfigMarker } from "../../data/globals";
import { initQino, type QinoConfig } from "../../runtime/qino/init-qino";
import { build } from "./build";
import { generateConfigFile } from "./generate-config-file";
import { generateTypes } from "./generate-types";

vi.mock("./generate-types", () => ({ generateTypes: vi.fn() }));
vi.mock("./generate-config-file", () => ({ generateConfigFile: vi.fn() }));

const cloud = {
  publish: { mode: "open_pull_request", reviewBeforePublish: true },
} as const;

afterEach(() => {
  vi.clearAllMocks();
});

function setup(config: Partial<QinoConfig> = {}) {
  const qino = initQino({
    contentFolder: "src/content",
    mediaFolder: "public",
    ...config,
  });
  const collection = qino.defineCollection({
    directory: "posts",
    schema: z.object({ title: z.string() }),
    extension: ".md",
  });

  return {
    context: qino[QinoConfigMarker],
    collections: [collection],
    items: [],
    trees: [],
  };
}

describe("build", () => {
  test("generates types by default", async () => {
    await build(setup());

    expect(generateTypes).toHaveBeenCalledOnce();
    expect(generateConfigFile).not.toHaveBeenCalled();
  });

  test("generates types when cli.build.types is true", async () => {
    await build(setup({ cli: { build: { types: true } } }));

    expect(generateTypes).toHaveBeenCalledOnce();
  });

  test("skips types when cli.build.types is false", async () => {
    await build(setup({ cli: { build: { types: false } } }));

    expect(generateTypes).not.toHaveBeenCalled();
  });

  test("still generates the config file when types are skipped", async () => {
    await build(setup({ cli: { build: { types: false } }, cloud }));

    expect(generateTypes).not.toHaveBeenCalled();
    expect(generateConfigFile).toHaveBeenCalledOnce();
  });
});
