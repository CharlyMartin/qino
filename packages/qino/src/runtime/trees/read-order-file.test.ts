import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { getOrderFromFile } from "./get-order-from-file";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-order-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("getOrderFromFile", () => {
  test("returns undefined when the order file is absent", async () => {
    expect(
      await getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).toBeUndefined();
  });

  test("returns parsed entries when the file is an array of filenames", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro.md", "guides.md", "react.md"]),
    );
    const result = await getOrderFromFile({
      folder: tmp,
      fileName: "_order.json",
      extension: ".md",
    });
    expect(result?.entries).toEqual(["intro.md", "guides.md", "react.md"]);
    expect(result?.path).toBe(nodePath.join(tmp, "_order.json"));
  });

  test("throws when the file is not an array", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify({ entries: ["intro.md"] }),
    );
    await expect(
      getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).rejects.toThrow(/expected an array of filenames ending in "\.md"/);
  });

  test("throws when the file contains non-string entries", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro.md", 42]),
    );
    await expect(
      getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).rejects.toThrow(/expected an array of filenames ending in "\.md"/);
  });

  test("throws when an entry is missing the extension", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro.md", "guides"]),
    );
    await expect(
      getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).rejects.toThrow(/must end with "\.md"/);
  });

  test("throws when an entry has the wrong extension", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro.mdx", "guides.mdx"]),
    );
    await expect(
      getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).rejects.toThrow(/must end with "\.md"/);
  });

  test("throws when the file is not valid JSON", async () => {
    await fs.writeFile(nodePath.join(tmp, "_order.json"), "{ not json");
    await expect(
      getOrderFromFile({
        folder: tmp,
        fileName: "_order.json",
        extension: ".md",
      }),
    ).rejects.toThrow(/is not valid JSON/);
  });

  test("honours a custom orderFileName", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "sidebar.json"),
      JSON.stringify(["one.md", "two.md"]),
    );
    const result = await getOrderFromFile({
      folder: tmp,
      fileName: "sidebar.json",
      extension: ".md",
    });
    expect(result?.entries).toEqual(["one.md", "two.md"]);
  });
});
