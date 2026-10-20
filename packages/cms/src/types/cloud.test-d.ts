import { initQino } from "@qino/cms";
import { test } from "vitest";
import { z } from "zod";

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
  cloud: {
    publish: {
      mode: "open_pull_request",
      reviewBeforePublish: true,
      branchPrefix: "content/",
    },
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

test("configures review with an object", () => {
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: {
      publish: {
        mode: "commit_to_default_branch",
        reviewBeforePublish: { bypassIfAdmin: true },
      },
    },
  });
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: {
      publish: {
        mode: "open_pull_request",
        reviewBeforePublish: false,
        // @ts-expect-error bypassing review is set on reviewBeforePublish.
        bypassReviewIfAdmin: true,
      },
    },
  });
});

test("accepts a computed reviewBeforePublish", () => {
  const reviewBeforePublish = process.env.QINO_REVIEW == "true";

  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: { publish: { mode: "open_pull_request", reviewBeforePublish } },
  });
});

test("hides optional fields only", () => {
  const withOptional = z.object({
    title: z.string(),
    notes: z.string().optional(),
    status: z.string().default("draft"),
  });

  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: withOptional,
    cloud: { hiddenFields: ["notes", "status"] },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema: withOptional,
    cloud: { hiddenFields: ["notes"] },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema: withOptional,
    cloud: { hiddenFields: ["status"] },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: withOptional,
    // @ts-expect-error editors couldn't create entries without "title".
    cloud: { hiddenFields: ["title"] },
  });
});

test("hides fields only when every union variant makes them optional", () => {
  const variants = z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("a"),
      secret: z.string(),
      notes: z.string().optional(),
    }),
    z.object({
      kind: z.literal("b"),
      secret: z.string().optional(),
      notes: z.string().optional(),
    }),
  ]);

  qino.defineItem({
    file: "pages/home.md",
    schema: variants,
    cloud: { hiddenFields: ["notes"] },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema: variants,
    // @ts-expect-error variant "a" requires "secret".
    cloud: { hiddenFields: ["secret"] },
  });
});

test("checks saveEntryAs tokens against required scalar fields", () => {
  const author = z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    company: z.string().optional(),
    role: z.string().default("writer"),
    tags: z.array(z.string()),
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    cloud: { saveEntryAs: "{firstName}-{lastName}", searchableBy: ["company"] },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    cloud: { saveEntryAs: "author-{lastName}-{age}" },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    cloud: { saveEntryAs: "{title}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "nope" isn't a field.
    cloud: { saveEntryAs: "{firstName}-{nope}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "company" is optional.
    cloud: { saveEntryAs: "{company}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "role" has a default, so it's optional on disk.
    cloud: { saveEntryAs: "{role}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "tags" isn't a scalar.
    cloud: { saveEntryAs: "{tags}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error no {field}.
    cloud: { saveEntryAs: "author" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error folders are added by the cloud UI.
    cloud: { saveEntryAs: "people/{lastName}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error the extension is added by the cloud UI.
    cloud: { saveEntryAs: "{lastName}.json" },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema,
    // @ts-expect-error items are a single, fixed file.
    cloud: { saveEntryAs: "{title}" },
  });
});

test("checks saveEntryAs tokens in every union variant", () => {
  const variants = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("a"), title: z.string(), slug: z.string() }),
    z.object({
      kind: z.literal("b"),
      title: z.string(),
      slug: z.string().optional(),
    }),
  ]);

  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: variants,
    cloud: { saveEntryAs: "{kind}-{title}" },
  });
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: variants,
    // @ts-expect-error variant "b" makes "slug" optional.
    cloud: { saveEntryAs: "{slug}" },
  });
});

test("can't check a widened saveEntryAs", () => {
  const saveEntryAs: string = "{nope}";

  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    cloud: { saveEntryAs },
  });
});

test("checks displayEntryAs tokens against required scalar fields", () => {
  const author = z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number(),
    company: z.string().optional(),
    tags: z.array(z.string()),
  });

  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    cloud: { displayEntryAs: "{lastName}, {firstName} ({age})" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "nope" isn't a field.
    cloud: { displayEntryAs: "{firstName} {nope}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "company" is optional.
    cloud: { displayEntryAs: "{company}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error "tags" isn't a scalar.
    cloud: { displayEntryAs: "{tags}" },
  });
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema: author,
    // @ts-expect-error no {field}.
    cloud: { displayEntryAs: "Author" },
  });
});

test("makes displayEntryAs optional", () => {
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    cloud: { searchableBy: ["title"] },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    cloud: { searchableBy: ["title"] },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    cloud: { displayEntryAs: "Docs: {title}" },
  });
});

test("names every primitive with displayAs, but labels items with it only", () => {
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    cloud: { displayAs: "Blog posts", displayEntryAs: "{title}" },
  });
  qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
    cloud: { displayAs: "Documentation" },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema,
    cloud: { displayAs: "Home page" },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema,
    // @ts-expect-error an item is a single entry, named with displayAs.
    cloud: { displayEntryAs: "{title}" },
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
      media: { saveFileAs: "posts/{field}/{name}" },
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
    cloud: { searchableBy: ["title"], media: { saveFileAs: "docs/{name}" } },
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
    cloud: { media: { saveFileAs: "home/{name}" } },
  });
  qino.defineItem({
    file: "pages/home.md",
    schema,
    // @ts-expect-error items are a single file.
    cloud: { searchableBy: ["title"] },
  });
});
