import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import type { AnyMediaConfig } from "../../types/media";
import { createDependencyCollector } from "../cache/create-dependency-collector";
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
    contentFolder: nodePath.join(tmp, "content"),
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

  test("records each image file, with the stat its checks and decode used", async () => {
    const dependencies = createDependencyCollector();
    const imagePath = nodePath.join(tmp, "images", "a.png");
    await fs.utimes(imagePath, 1_000, 1_000);

    await resolveEntryMedia({
      entry: { cover: "/images/a.png", gallery: ["/images/a.png"] },
      media: { cover: image, "gallery[*]": image },
      mediaFolder: tmp,
      contentFolder: nodePath.join(tmp, "content"),
      filePath: "posts/a.md",
      dependencies,
    });

    const { ino, size } = await fs.stat(imagePath, { bigint: true });
    expect([...dependencies.observations]).toEqual([
      [
        imagePath,
        { version: `${ino}:${1_000_000_000_000n}:${size}`, untrusted: false },
      ],
    ]);
    expect(dependencies.isReusable()).toBe(true);
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

  test("leaves other media fields and the body alone", async () => {
    const entry = { attachment: "/files/a.pdf", markdown: "![](/x.png)" };

    expect(
      await resolve(entry, {
        attachment: { accepted: "application/pdf", maxSize: "1MB" },
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

  describe("parse", () => {
    const wikilink = (value: string) => {
      const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
      return name ? `/images/${encodeURIComponent(name)}` : undefined;
    };

    test("reads the URL parse returns and uses it as src", async () => {
      const resolved = await resolve(
        { cover: "[[my image.png]]", gallery: ["[[a.png]]", "/images/b.png"] },
        {
          cover: { ...image, parse: wikilink },
          "gallery[*]": { ...image, parse: wikilink },
        },
      );

      expect(resolved).toMatchObject({
        cover: { src: "/images/my%20image.png", width: 16 },
        gallery: [{ src: "/images/a.png" }, { src: "/images/b.png" }],
      });
    });

    test("passes the file, path, and media folder", async () => {
      const calls: Array<unknown> = [];
      await resolve(
        { cover: "/images/a.png" },
        {
          cover: {
            ...image,
            parse: (...args) => {
              calls.push(args);
              return undefined;
            },
          },
        },
      );

      expect(calls).toEqual([
        [
          "/images/a.png",
          {
            sourceFilePath: "posts/a.md",
            fieldPath: "cover",
            mediaFolder: tmp,
          },
        ],
      ]);
    });

    test("replaces the value of fields that aren't images", async () => {
      expect(
        await resolve(
          { attachment: "[[guide.pdf]]", other: null },
          {
            attachment: {
              accepted: "application/pdf",
              maxSize: "1MB",
              parse: wikilink,
            },
            other: {
              accepted: "application/pdf",
              maxSize: "1MB",
              parse: wikilink,
            },
          },
        ),
      ).toEqual({ attachment: "/images/guide.pdf", other: null });
    });

    test("names the raw value when the parsed URL is missing", async () => {
      await expect(
        resolve(
          { cover: "[[missing.png]]" },
          { cover: { ...image, parse: wikilink } },
        ),
      ).rejects.toThrow(
        /media "cover" \(parsed from "\[\[missing\.png\]\]"\): "\/images\/missing\.png" doesn't exist/,
      );
    });
  });

  describe("image manifest", () => {
    const manifestPath = () =>
      nodePath.join(tmp, "content", ".qino", "images.json");
    const recorded = { width: 40, height: 20, size: 2_000 };

    async function writeManifest(manifest: object | string) {
      await fs.mkdir(nodePath.dirname(manifestPath()), { recursive: true });
      await fs.writeFile(
        manifestPath(),
        typeof manifest == "string" ? manifest : JSON.stringify(manifest),
      );
    }

    test("reads an image missing from mediaFolder from it", async () => {
      await writeManifest({ "/images/gone.png": recorded });

      expect(await resolve({ cover: "/images/gone.png" })).toEqual({
        cover: { src: "/images/gone.png", width: 40, height: 20 },
      });
    });

    test("reads a file in mediaFolder over it", async () => {
      await writeManifest({ "/images/a.png": recorded });

      expect(await resolve({ cover: "/images/a.png" })).toMatchObject({
        cover: { src: "/images/a.png", width: 16, height: 8 },
      });
    });

    test("checks each field's rule against the recorded size and type", async () => {
      await writeManifest({ "/images/gone.png": { ...recorded, size: 3_000 } });

      await expect(
        resolve(
          { cover: "/images/gone.png" },
          { cover: { accepted: "image/png", maxSize: "50KB" } },
        ),
      ).resolves.toMatchObject({ cover: { width: 40 } });
      await writeManifest({
        "/images/gone.png": { ...recorded, size: 60 * 1024 },
      });
      await expect(
        resolve(
          { cover: "/images/gone.png" },
          { cover: { accepted: "image/png", maxSize: "50KB" } },
        ),
      ).rejects.toThrow(
        'posts/a.md: media "cover": "/images/gone.png" is 60KB, over the 50KB limit.',
      );
      await expect(
        resolve(
          { cover: "/images/gone.png" },
          { cover: { accepted: "image/webp", maxSize: "1MB" } },
        ),
      ).rejects.toThrow(
        '"/images/gone.png" is image/png, but only image/webp is accepted.',
      );
    });

    test("doesn't cover a file sharp fails to decode", async () => {
      await fs.writeFile(nodePath.join(tmp, "images", "broken.png"), "nope");
      await writeManifest({ "/images/broken.png": recorded });

      await expect(resolve({ cover: "/images/broken.png" })).rejects.toThrow(
        'posts/a.md: media "cover": ',
      );
    });

    test("records the manifest and the image's absence as the entry's dependencies", async () => {
      await writeManifest({ "/images/gone.png": recorded });
      const dependencies = createDependencyCollector();

      await resolveEntryMedia({
        entry: { cover: "/images/gone.png" },
        media: { cover: image },
        mediaFolder: tmp,
        contentFolder: nodePath.join(tmp, "content"),
        filePath: "posts/a.md",
        dependencies,
      });

      expect([...dependencies.observations]).toEqual([
        [
          nodePath.join(tmp, "images", "gone.png"),
          { version: "absent", untrusted: false },
        ],
        [manifestPath(), expect.objectContaining({ untrusted: true })],
      ]);
      expect(dependencies.isReusable()).toBe(true);
    });

    test("reads it again once rewritten", async () => {
      await writeManifest({ "/images/gone.png": recorded });
      await resolve({ cover: "/images/gone.png" });
      await writeManifest({ "/images/gone.png": { ...recorded, width: 80 } });

      expect(await resolve({ cover: "/images/gone.png" })).toMatchObject({
        cover: { width: 80 },
      });
    });

    test("fails on a manifest that isn't JSON, naming it and qino build", async () => {
      await writeManifest("{ nope");

      await expect(resolve({ cover: "/images/gone.png" })).rejects.toThrow(
        `posts/a.md: media "cover": "${manifestPath()}" isn't a valid image manifest. Run \`qino build\` to write it again.`,
      );
    });
  });
});
