import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { check } from "../cli/check/check";
import { QinoConfigMarker } from "../data/globals";
import { initQino } from "../runtime/qino/init-qino";
import { createCloudProject } from "./create-cloud-project";
import { createImageProject } from "./create-image-project";

// A serverless bundle without sharp's native binary: qino build, in a child
// process, still has it.
vi.mock("sharp", () => {
  throw new Error(
    'Could not load the "sharp" module using the linux-arm64 runtime',
  );
});

const exec = promisify(execFile);
const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const jitiCli = path.join(packageRoot, "node_modules/jiti/lib/jiti-cli.mjs");
const cli = path.join(packageRoot, "src/cli/index.ts");

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-image-manifest-"));
  const { default: sharp } =
    await vi.importActual<typeof import("sharp")>("sharp");
  await createImageProject(tmp, {
    images: {
      "cover.webp": await sharp({
        create: { width: 32, height: 16, channels: 3, background: "#00f" },
      })
        .webp()
        .toBuffer(),
      "avatars/jane.png": await sharp({
        create: { width: 8, height: 12, channels: 3, background: "#0f0" },
      })
        .png()
        .toBuffer(),
    },
  });
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

function build(cwd = tmp) {
  const { CI: _, ...env } = process.env;

  return exec(process.execPath, [jitiCli, cli, "build"], {
    cwd,
    env: { ...env, CONSOLA_LEVEL: "3" },
  });
}

/** The project's definitions, as a deployed server without `public/` reads them. */
function setup() {
  const qino = initQino({
    contentFolder: path.join(tmp, "content"),
    mediaFolder: path.join(tmp, "public"),
  });
  const authors = qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: z.object({ name: z.string(), avatar: z.string() }),
    media: {
      avatar: {
        accepted: "image/png",
        maxSize: "1MB",
        parse: (value) => value.replace(/^\[\[(.+)\]\]$/u, "/avatars/$1"),
      },
    },
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({
      title: z.string(),
      cover: z.string(),
      author: z.string(),
    }),
    relations: { author: authors },
    media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
    views: (view) => ({ default: view({}) }),
  });

  return { context: qino[QinoConfigMarker], authors, posts };
}

describe("image manifest", () => {
  test("a server without the media folder or sharp reads the images qino build recorded", async () => {
    await build();
    await fs.rm(path.join(tmp, "public"), { recursive: true });

    const { posts } = setup();
    const post = await posts.getEntry("hello");
    const [listed] = await posts.getEntries();

    expect(listed?.cover).toEqual(post.cover);
    expect(post.cover).toEqual({
      src: "/cover.webp",
      width: 32,
      height: 16,
      blurDataURL: expect.stringMatching(/^data:image\/webp;base64,/u),
      blurWidth: 8,
      blurHeight: 4,
    });
    expect(post.author.avatar).toEqual({
      src: "/avatars/jane.png",
      width: 8,
      height: 12,
      blurDataURL: expect.stringMatching(/^data:image\/png;base64,/u),
      blurWidth: 5,
      blurHeight: 8,
    });
  }, 60_000);

  test("a server with the media folder but without sharp reads the images qino build recorded", async () => {
    await build();

    const post = await setup().posts.getEntry("hello");

    expect(post.cover).toMatchObject({
      src: "/cover.webp",
      width: 32,
      height: 16,
    });
    expect(post.author.avatar).toMatchObject({
      src: "/avatars/jane.png",
      width: 8,
      height: 12,
    });
  }, 60_000);

  test("without a build, a server without the media folder fails naming qino build", async () => {
    await fs.rm(path.join(tmp, "public"), { recursive: true });
    const manifestPath = path.join(tmp, "content/.qino/images.json");

    await expect(setup().posts.getEntry("hello")).rejects.toThrow(
      `media "cover": "/cover.webp" doesn't exist in "${path.join(tmp, "public")}". Nor does "${manifestPath}" record it: run \`qino build\` to record it.`,
    );
  });

  test("qino build records each image's size beside a .gitignore", async () => {
    await build();

    const folder = path.join(tmp, "content/.qino");
    const manifest = JSON.parse(
      await fs.readFile(path.join(folder, "images.json"), "utf8"),
    );
    const sizeOf = async (url: string) =>
      (await fs.stat(path.join(tmp, "public", url))).size;

    expect(Object.keys(manifest)).toEqual(["/avatars/jane.png", "/cover.webp"]);
    expect(manifest["/cover.webp"]).toMatchObject({
      size: await sizeOf("cover.webp"),
      width: 32,
      height: 16,
    });
    expect(manifest["/avatars/jane.png"].size).toBe(
      await sizeOf("avatars/jane.png"),
    );
    expect(await fs.readFile(path.join(folder, ".gitignore"), "utf8")).toBe(
      "*\n",
    );
  }, 60_000);

  test("qino build writes no image manifest without image fields", async () => {
    const project = path.join(tmp, "no-images");
    await fs.mkdir(project);
    await createCloudProject(project);

    await build(project);

    await expect(
      fs.access(path.join(project, "content/.qino")),
    ).rejects.toThrow("ENOENT");
  }, 60_000);

  test("qino check decodes images instead of reading the image manifest", async () => {
    await build();
    const { context, authors, posts } = setup();

    await expect(
      check({
        entryFilePath: path.join(tmp, "qino/index.ts"),
        context,
        collections: [authors, posts],
        items: [],
        trees: [],
      }),
    ).rejects.toThrow("Image fields are read with sharp, which can't load");
  }, 60_000);
});
