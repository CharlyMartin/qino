import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { AnyMediaConfig } from "../../types/media";
import { resolveEntryMedia } from "./resolve-entry-media";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-media-"));
  await fs.mkdir(nodePath.join(tmp, "images"));
  for (const name of ["a.png", "b.png", "my image.png"]) {
    await sharp({
      create: { width: 16, height: 8, channels: 3, background: "#000" },
    }).toFile(nodePath.join(tmp, "images", name));
  }
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const image = { accepted: "image/png", maxSize: "1MB" } as const;

function resolve(entry: object, media: AnyMediaConfig = { cover: image }) {
  return resolveEntryMedia({
    entry,
    media,
    mediaFolder: tmp,
    filePath: "posts/a.md",
  });
}

describe("resolveEntryMedia", () => {
  test("replaces image fields, nested and in arrays", async () => {
    const resolved = await resolve(
      {
        title: "A",
        cover: "/images/a.png",
        gallery: ["/images/a.png", "/images/b.png"],
        seo: { image: "/images/my%20image.png" },
      },
      { cover: image, "gallery[*]": image, "seo.image": image },
    );

    const data = { width: 16, height: 8, blurWidth: 8, blurHeight: 4 };
    expect(resolved).toMatchObject({
      title: "A",
      cover: { src: "/images/a.png", ...data },
      gallery: [
        { src: "/images/a.png", ...data },
        { src: "/images/b.png", ...data },
      ],
      seo: { image: { src: "/images/my%20image.png", ...data } },
    });
  });

  test("leaves null and missing values", async () => {
    expect(await resolve({ cover: null })).toEqual({ cover: null });
    expect(await resolve({ title: "A" })).toEqual({ title: "A" });
  });

  test("leaves a null array of images", async () => {
    expect(await resolve({ gallery: null }, { "gallery[*]": image })).toEqual({
      gallery: null,
    });
  });

  test("leaves BMP fields as strings", async () => {
    const entry = { cover: "/images/a.bmp" };

    expect(
      await resolve(entry, {
        cover: { accepted: "image/bmp", maxSize: "1MB" },
      }),
    ).toEqual(entry);
  });

  test("leaves other media fields and markdown alone", async () => {
    const entry = { attachment: "/files/a.pdf", markdown: "![](/x.png)" };

    expect(
      await resolve(entry, {
        attachment: { accepted: "application/pdf", maxSize: "1MB" },
        markdown: [{ accepted: "image/png", maxSize: "1MB" }],
      }),
    ).toEqual(entry);
  });

  test.each(["https://example.com/a.png", "//cdn.example.com/a.png", "a.png"])(
    "throws on %s, which isn't in mediaFolder",
    async (url) => {
      await expect(resolve({ cover: url })).rejects.toThrow(
        `posts/a.md: media "cover" must be a URL in mediaFolder, starting with "/". Got "${url}".`,
      );
    },
  );

  test("throws on a file of another type", async () => {
    await expect(
      resolve(
        { cover: "/images/a.png" },
        { cover: { accepted: "image/webp", maxSize: "1MB" } },
      ),
    ).rejects.toThrow(
      'posts/a.md: media "cover": "/images/a.png" is image/png, but only image/webp is accepted.',
    );
  });

  test("throws on a file over maxSize", async () => {
    const noise = crypto.getRandomValues(new Uint8Array(140 * 140 * 3));
    await sharp(Buffer.from(noise), {
      raw: { width: 140, height: 140, channels: 3 },
    })
      .png()
      .toFile(nodePath.join(tmp, "images", "large.png"));

    await expect(
      resolve(
        { cover: "/images/large.png" },
        { cover: { accepted: "image/png", maxSize: "50KB" } },
      ),
    ).rejects.toThrow(
      /^posts\/a\.md: media "cover": "\/images\/large\.png" is \d+KB, over the 50KB limit\.$/u,
    );
  });

  test("throws on missing files", async () => {
    await expect(resolve({ cover: "/images/missing.png" })).rejects.toThrow(
      `posts/a.md: media "cover": "/images/missing.png" doesn't exist in "${tmp}".`,
    );
  });
});
