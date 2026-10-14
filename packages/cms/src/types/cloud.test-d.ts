import { initQino } from "@qino/cms";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

import type { CloudMediaSize } from "./cloud";

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cloud: {
    publish: {
      mode: "open_pull_request",
      reviewBeforePublish: true,
      branchPrefix: "content/",
    },
    media: { accepted: [{ type: "image/*", maxSize: "5MB" }] },
  },
});
const schema = z.object({
  title: z.string(),
  views: z.number().optional(),
  tags: z.array(z.string()),
});

test("rejects branchPrefix when committing to the default branch", () => {
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: {
      publish: {
        mode: "commit_to_default_branch",
        reviewBeforePublish: false,
        // @ts-expect-error branchPrefix only applies to pull requests.
        branchPrefix: "qino/",
      },
    },
  });
});

test("requires reviewBeforePublish", () => {
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    // @ts-expect-error reviewBeforePublish is mandatory.
    cloud: { publish: { mode: "commit_to_default_branch" } },
  });
});

test("types collection fields against the schema", () => {
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    cloud: {
      searchableBy: ["title", "tags"],
      sortableBy: ["title", "views"],
      media: { saveAs: "posts/{name}.{ext}", accepted: [] },
    },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    // @ts-expect-error "subtitle" isn't a schema field.
    cloud: { searchableBy: ["subtitle"] },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    // @ts-expect-error "tags" isn't a scalar.
    cloud: { sortableBy: ["tags"] },
  });
});

test("types fields against the schema input, not its output", () => {
  const transformed = z
    .object({ "created-on": z.iso.datetime(), published: z.coerce.date() })
    .transform((post) => ({ createdOn: post["created-on"] }));

  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: transformed,
    cloud: { searchableBy: ["created-on"], sortableBy: ["created-on"] },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: transformed,
    // @ts-expect-error "createdOn" only exists after the transform.
    cloud: { searchableBy: ["createdOn"] },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: transformed,
    // @ts-expect-error coerced fields aren't guaranteed scalars on disk.
    cloud: { sortableBy: ["published"] },
  });
});

test("gives trees search and media, but no sort", () => {
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    cloud: { searchableBy: ["title"], media: { saveAs: "docs/{name}.{ext}" } },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    // @ts-expect-error trees are ordered by their order file.
    cloud: { sortableBy: ["title"] },
  });
});

test("gives items media only", () => {
  qino.defineItem({
    file: "pages/home.md",
    schema,
    cloud: { media: { saveAs: "home/{name}.{ext}" } },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema,
    // @ts-expect-error items are a single file.
    cloud: { searchableBy: ["title"] },
  });
});

test("types maxSize as 50–950KB in steps of 50, or 1–100MB", () => {
  const sizes: Array<CloudMediaSize> = ["50KB", "950KB", "1MB", "100MB"];
  expectTypeOf(sizes).toEqualTypeOf<Array<CloudMediaSize>>();

  // @ts-expect-error plain numbers aren't sizes.
  const bytes: CloudMediaSize = 5000;
  // @ts-expect-error B isn't a unit.
  const byteUnit: CloudMediaSize = "1B";
  // @ts-expect-error KB goes in steps of 50.
  const offStep: CloudMediaSize = "25KB";
  // @ts-expect-error KB tops out at 950.
  const tooManyKilobytes: CloudMediaSize = "999KB";
  // @ts-expect-error MB tops out at 100.
  const tooManyMegabytes: CloudMediaSize = "101MB";
  // @ts-expect-error sizes are whole numbers.
  const decimal: CloudMediaSize = "1.5MB";
  // @ts-expect-error units are uppercase.
  const lowercase: CloudMediaSize = "5mb";
  // @ts-expect-error no space between number and unit.
  const spaced: CloudMediaSize = "5 MB";
  // @ts-expect-error GB isn't a unit.
  const gigabytes: CloudMediaSize = "1GB";

  expectTypeOf([
    bytes,
    byteUnit,
    offStep,
    tooManyKilobytes,
    tooManyMegabytes,
    decimal,
    lowercase,
    spaced,
    gigabytes,
  ]).toBeArray();
});
