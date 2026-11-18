import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getImageData } from "./get-image-data";

// Counts sharp calls, to tell how many decodes ran.
const sharpCalls = vi.hoisted(() => ({ count: 0 }));
vi.mock("sharp", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sharp")>();
  const counted = (...args: Parameters<typeof actual.default>) => {
    sharpCalls.count += 1;
    return actual.default(...args);
  };
  return { ...actual, default: Object.assign(counted, actual.default) };
});

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-image-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeImage(name: string, width: number, height: number) {
  const filePath = nodePath.join(tmp, name);
  await sharp({
    create: { width, height, channels: 3, background: "#ff0000" },
  }).toFile(filePath);
  return filePath;
}

describe("getImageData", () => {
  test("reads dimensions and an 8px blur for a landscape PNG", async () => {
    const filePath = await writeImage("a.png", 40, 20);

    const data = await getImageData(filePath, "/a.png");

    expect(data).toMatchObject({
      src: "/a.png",
      width: 40,
      height: 20,
      blurWidth: 8,
      blurHeight: 4,
    });
    expect(data.blurDataURL).toMatch(/^data:image\/png;base64,/u);
    const blur = Buffer.from(data.blurDataURL?.split(",")[1] ?? "", "base64");
    expect(await sharp(blur).metadata()).toMatchObject({
      format: "png",
      width: 8,
      height: 4,
    });
  });

  test("keeps the long side at 8px for portrait images", async () => {
    const filePath = await writeImage("a.webp", 20, 40);

    expect(await getImageData(filePath, "/a.webp")).toMatchObject({
      blurWidth: 4,
      blurHeight: 8,
      blurDataURL: expect.stringMatching(/^data:image\/webp;base64,/u),
    });
  });

  test("keeps at least 1px on the short side", async () => {
    const filePath = await writeImage("a.jpg", 400, 2);

    expect(await getImageData(filePath, "/a.jpg")).toMatchObject({
      blurWidth: 8,
      blurHeight: 1,
      blurDataURL: expect.stringMatching(/^data:image\/jpeg;base64,/u),
    });
  });

  test("leaves the blur out for GIF and SVG, as Next does", async () => {
    const gif = await writeImage("a.gif", 10, 10);
    const svg = nodePath.join(tmp, "a.svg");
    await fs.writeFile(
      svg,
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"></svg>',
    );

    expect(await getImageData(gif, "/a.gif")).toEqual({
      src: "/a.gif",
      width: 10,
      height: 10,
    });
    expect(await getImageData(svg, "/a.svg")).toEqual({
      src: "/a.svg",
      width: 24,
      height: 12,
    });
  });

  test("reads a file again once it changes", async () => {
    const filePath = await writeImage("a.png", 40, 20);
    expect(await getImageData(filePath, "/a.png")).toMatchObject({ width: 40 });

    await writeImage("a.png", 30, 30);
    const later = new Date(Date.now() + 10_000);
    await fs.utimes(filePath, later, later);

    expect(await getImageData(filePath, "/a.png")).toMatchObject({ width: 30 });
  });

  test("keys the cache on the observation it's given", async () => {
    const filePath = await writeImage("a.png", 40, 20);
    const observation = { version: "1:1:1", untrusted: false };
    expect(await getImageData(filePath, "/a.png", observation)).toMatchObject({
      width: 40,
    });

    // The same version says the same file, so the cached decode is used.
    await writeImage("a.png", 30, 30);
    expect(await getImageData(filePath, "/a.png", observation)).toMatchObject({
      width: 40,
    });
    expect(
      await getImageData(filePath, "/a.png", { ...observation, version: "2" }),
    ).toMatchObject({ width: 30 });
  });

  test("decodes an untrusted file again, without keeping or using a cached decode", async () => {
    const filePath = await writeImage("a.png", 40, 20);
    const trusted = { version: "1:1:1", untrusted: false };
    await getImageData(filePath, "/a.png", trusted);

    await writeImage("a.png", 30, 30);
    expect(
      await getImageData(filePath, "/a.png", { ...trusted, untrusted: true }),
    ).toMatchObject({ width: 30 });

    // The stale decode was dropped, so a trusted read decodes again too.
    await writeImage("a.png", 20, 20);
    expect(await getImageData(filePath, "/a.png", trusted)).toMatchObject({
      width: 20,
    });
  });

  test("shares one decode of an untrusted file between concurrent calls, and keeps none", async () => {
    const filePath = await writeImage("a.png", 40, 20);
    const untrusted = { version: "1:1:1", untrusted: true };
    sharpCalls.count = 0;

    await Promise.all([
      getImageData(filePath, "/a.png", untrusted),
      getImageData(filePath, "/a.png", untrusted),
    ]);
    const shared = sharpCalls.count;
    await getImageData(filePath, "/a.png", untrusted);

    // A PNG decode reads the metadata, then makes the blur.
    expect(shared).toBe(2);
    expect(sharpCalls.count).toBe(4);
  });

  test("throws on files that aren't images", async () => {
    const filePath = nodePath.join(tmp, "a.pdf");
    await fs.writeFile(filePath, "%PDF-1.7");

    await expect(getImageData(filePath, "/a.pdf")).rejects.toThrow(
      `"${filePath}" isn't an image.`,
    );
  });

  test("throws on missing files", async () => {
    await expect(
      getImageData(nodePath.join(tmp, "missing.png"), "/missing.png"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
