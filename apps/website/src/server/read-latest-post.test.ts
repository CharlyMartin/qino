import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { initQino } from "@qino/cms";
import { afterEach, beforeEach, expect, test } from "vitest";
import { z } from "zod";

import { readLatestPost } from "./read-latest-post";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "website-posts-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writePost(slug: string, title: string, publishedOn: string) {
  await fs.writeFile(
    nodePath.join(tmp, "posts", `${slug}.md`),
    ["---", `title: ${title}`, `published-on: "${publishedOn}"`, "---"].join(
      "\n",
    ),
  );
}

// Sorted like `postCollection`'s default view: newest first.
function definePosts() {
  const qino = initQino({ contentFolder: tmp, mediaFolder: tmp });
  return qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({ title: z.string(), "published-on": z.iso.date() }),
    views: (view) => ({
      default: view({
        sort: (a, b) => b["published-on"].localeCompare(a["published-on"]),
      }),
    }),
  });
}

test("reads the newest post, not the first slug", async () => {
  await writePost("a-first", "First", "2026-01-01");
  await writePost("b-newest", "Newest", "2026-03-01");
  await writePost("c-second", "Second", "2026-02-01");

  expect(await readLatestPost(definePosts())).toEqual({
    slug: "b-newest",
    title: "Newest",
  });
});

test("returns null before the first post", async () => {
  expect(await readLatestPost(definePosts())).toBeNull();
});
