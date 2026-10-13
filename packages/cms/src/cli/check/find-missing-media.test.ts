import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { findMissingMedia } from "./find-missing-media";

let tmp: string;
let contentFolder: string;
let folder: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-media-"));
  contentFolder = nodePath.join(tmp, "content");
  folder = nodePath.join(tmp, "public");
  await fs.mkdir(nodePath.join(contentFolder, "posts"), { recursive: true });
  await fs.mkdir(nodePath.join(folder, "images"), { recursive: true });
  await fs.writeFile(nodePath.join(folder, "images/a.png"), "");
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("findMissingMedia", () => {
  test("returns nothing when every reference exists", async () => {
    await fs.writeFile(
      nodePath.join(contentFolder, "posts/hello.md"),
      "---\ncover: /images/a.png\n---\n\n![](/images/a.png)\n",
    );

    expect(
      await findMissingMedia({
        contentFolder,
        mediaFolder: folder,
      }),
    ).toEqual([]);
  });

  test("reports every missing reference across files", async () => {
    const md = nodePath.join(contentFolder, "posts/hello.md");
    const json = nodePath.join(contentFolder, "settings.json");
    await fs.writeFile(md, "![](/images/a.png)\n![](/images/b.png)\n");
    await fs.writeFile(json, JSON.stringify({ logo: "/logo.svg" }));

    const missing = await findMissingMedia({
      contentFolder,
      mediaFolder: folder,
    });

    expect(missing).toEqual([
      { file: md, line: 2, url: "/images/b.png" },
      { file: json, line: 1, url: "/logo.svg" },
    ]);
  });

  test("skips extensionless and excluded urls", async () => {
    await fs.writeFile(
      nodePath.join(contentFolder, "posts/hello.md"),
      [
        "---",
        "canonical: /blog/hello",
        "---",
        "[RSS](/rss.xml)",
        "![](/api/og)",
        "![](/api/og/hello.png)",
      ].join("\n"),
    );

    expect(
      await findMissingMedia({
        contentFolder,
        mediaFolder: folder,
        checkLocalAssetReferences: { exclude: ["/api/**", "/rss.xml"] },
      }),
    ).toEqual([]);
  });

  test("names the MDX file when it cannot be parsed", async () => {
    const mdx = nodePath.join(contentFolder, "broken.mdx");
    await fs.writeFile(mdx, "<Image src=");

    await expect(
      findMissingMedia({
        contentFolder,
        mediaFolder: folder,
      }),
    ).rejects.toThrow(`Could not scan "${mdx}" for media`);
  });

  test("names the file when it cannot be parsed", async () => {
    const json = nodePath.join(contentFolder, "broken.json");
    await fs.writeFile(json, "{");

    await expect(
      findMissingMedia({
        contentFolder,
        mediaFolder: folder,
      }),
    ).rejects.toThrow(`Could not scan "${json}" for media`);
  });
});
