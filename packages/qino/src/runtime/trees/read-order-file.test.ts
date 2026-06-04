import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { readOrderFile } from "./read-order-file";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-order-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("readOrderFile", () => {
  test("returns null when the order file is absent", async () => {
    expect(
      await readOrderFile({ folder: tmp, fileName: "_order.json" }),
    ).toBeNull();
  });

  test("returns parsed entries when the file is a string array", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro", "guides", "react"]),
    );
    const result = await readOrderFile({
      folder: tmp,
      fileName: "_order.json",
    });
    expect(result?.entries).toEqual(["intro", "guides", "react"]);
    expect(result?.path).toBe(nodePath.join(tmp, "_order.json"));
  });

  test("throws when the file is not a string array", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify({ entries: ["intro"] }),
    );
    await expect(
      readOrderFile({ folder: tmp, fileName: "_order.json" }),
    ).rejects.toThrow(/expected an array of strings/);
  });

  test("throws when the file contains non-string entries", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["intro", 42]),
    );
    await expect(
      readOrderFile({ folder: tmp, fileName: "_order.json" }),
    ).rejects.toThrow(/expected an array of strings/);
  });

  test("throws when the file is not valid JSON", async () => {
    await fs.writeFile(nodePath.join(tmp, "_order.json"), "{ not json");
    await expect(
      readOrderFile({ folder: tmp, fileName: "_order.json" }),
    ).rejects.toThrow(/is not valid JSON/);
  });

  test("honours a custom orderFileName", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "sidebar.json"),
      JSON.stringify(["one", "two"]),
    );
    const result = await readOrderFile({
      folder: tmp,
      fileName: "sidebar.json",
    });
    expect(result?.entries).toEqual(["one", "two"]);
  });
});
