import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-agent-md-int-"));
  await fs.mkdir(nodePath.join(tmp, "posts"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writePost(slug: string, content: string) {
  await fs.writeFile(nodePath.join(tmp, "posts", `${slug}.md`), content);
}

function setup() {
  const qino = initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
    siteUrl: "https://example.com",
  });
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    }),
    pages: { index: "/blog", entry: "/blog/{slug}" },
  });

  return { posts };
}

describe("pages", () => {
  function definePages(pages: unknown, siteUrl = "https://example.com") {
    return () =>
      initQino({
        contentFolder: tmp,
        mediaFolder: tmp,
        siteUrl,
      }).defineCollection({
        directory: "posts",
        extension: ".md",
        schema: z.object({}),
        pages: pages as never,
      });
  }

  test("need a siteUrl", () => {
    const define = () =>
      initQino({ contentFolder: tmp, mediaFolder: tmp }).defineCollection({
        directory: "posts",
        extension: ".md",
        schema: z.object({}),
        pages: { index: "/blog", entry: "/blog/{slug}" },
      });

    expect(define).toThrow(
      'Collection "posts" declares pages, so initQino needs a siteUrl, such as "https://example.com".',
    );
  });

  test.each([
    [
      { index: "blog", entry: "/blog/{slug}" },
      'pages.index "blog" must start with "/".',
    ],
    [
      { index: "//evil.com", entry: "/blog/{slug}" },
      'pages.index "//evil.com" must be a path on the site, not "//".',
    ],
    [
      { index: "/blog", entry: "/blog/{slug}#top" },
      'pages.entry "/blog/{slug}#top" must be a path, without "?" or "#".',
    ],
    [
      { index: "/blog/{slug}", entry: "/blog/{slug}" },
      'pages.index "/blog/{slug}" takes no token.',
    ],
    [
      { index: "/blog", entry: "/blog" },
      'pages.entry "/blog" must contain {slug} once.',
    ],
    [
      { index: "/blog", entry: "/blog/{slug}/{slug}" },
      'pages.entry "/blog/{slug}/{slug}" must contain {slug} once.',
    ],
    [
      { index: "/blog", entry: "/blog/{year}/{slug}" },
      'pages.entry "/blog/{year}/{slug}" takes no token but {slug}.',
    ],
  ])("reject %j", (pages, message) => {
    expect(definePages(pages)).toThrow(`Collection "posts": ${message}`);
  });

  test("accept the site root as the index", () => {
    expect(definePages({ index: "/", entry: "/{slug}" })).not.toThrow();
  });
});

describe("Markdown URLs of collection entries", () => {
  test("are the entry page's URL with .md appended", () => {
    const { posts } = setup();

    expect(posts.getMarkdownUrl("hello")).toBe(
      "https://example.com/blog/hello.md",
    );
    expect(posts.getMarkdownUrl("hello world")).toBe(
      "https://example.com/blog/hello%20world.md",
    );
  });

  test("drop an entry page's trailing slash before .md", () => {
    const posts = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({}),
      pages: { index: "/blog/", entry: "/blog/{slug}/" },
    });

    expect(posts.getMarkdownUrl("hello")).toBe(
      "https://example.com/blog/hello.md",
    );
  });

  test("need pages, like agent Markdown", async () => {
    const posts = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({}),
    });
    const message =
      'Collection "posts" has no pages: declare them to get agent Markdown and Markdown URLs.';

    expect(() => posts.getMarkdownUrl("hello")).toThrow(message);
    await expect(posts.getAgentMarkdown("hello")).rejects.toThrow(message);
  });
});

describe("siteUrl", () => {
  test.each(["example.com", "https://example.com/blog", "ftp://example.com"])(
    "rejects %j, which isn't an http(s) origin",
    (siteUrl) => {
      expect(() =>
        initQino({ contentFolder: tmp, mediaFolder: tmp, siteUrl }),
      ).toThrow(
        `siteUrl "${siteUrl}" must be an http(s) origin, such as "https://example.com".`,
      );
    },
  );

  test("accepts an origin with a trailing slash", () => {
    expect(() =>
      initQino({
        contentFolder: tmp,
        mediaFolder: tmp,
        siteUrl: "https://example.com/",
      }),
    ).not.toThrow();
  });
});

describe("agent Markdown for collection entries", () => {
  test("opens with the title and description, then the body without frontmatter", async () => {
    await writePost(
      "hello",
      "---\ntitle: Hello\ndescription: A first post.\n---\n\nSome text.\n",
    );
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("hello")).toBe(
      "# Hello\n\n> A first post.\n\nSome text.\n",
    );
  });

  test("falls back to the slug for the title, and leaves out a missing description", async () => {
    await writePost("untitled", "---\n---\n\nSome text.\n");
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("untitled")).toBe(
      "# untitled\n\nSome text.\n",
    );
  });

  test("adds no heading when the body already starts with an H1", async () => {
    await writePost(
      "titled",
      "---\ntitle: Hello\ndescription: A first post.\n---\n\n# Hello, world\n\nSome text.\n",
    );
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("titled")).toBe(
      "# Hello, world\n\nSome text.\n",
    );
  });

  test("makes site-relative links, images and definitions absolute, and nothing else", async () => {
    await writePost(
      "links",
      [
        "---",
        "title: Links",
        "---",
        "",
        'See [the guide](/docs/guide#install "Guide") and ![a logo](/logo.png).',
        "",
        "Also [elsewhere](https://other.com/x), [a CDN](//cdn.com/x), [a sibling](./next), [an anchor](#top) and [a reference][ref].",
        "",
        "`[code](/docs/code)` stays as written.",
        "",
        "```md",
        "[fenced](/docs/fenced)",
        "```",
        "",
        "[ref]: </docs/ref page> 'Reference'",
        "",
      ].join("\n"),
    );
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("links")).toBe(
      [
        "# Links",
        "",
        'See [the guide](https://example.com/docs/guide#install "Guide") and ![a logo](https://example.com/logo.png).',
        "",
        "Also [elsewhere](https://other.com/x), [a CDN](//cdn.com/x), [a sibling](./next), [an anchor](#top) and [a reference][ref].",
        "",
        "`[code](/docs/code)` stays as written.",
        "",
        "```md",
        "[fenced](/docs/fenced)",
        "```",
        "",
        "[ref]: <https://example.com/docs/ref page> 'Reference'",
        "",
      ].join("\n"),
    );
  });

  test("reads an MDX body's H1 past its imports", async () => {
    await fs.mkdir(nodePath.join(tmp, "docs"));
    await fs.writeFile(
      nodePath.join(tmp, "docs", "intro.mdx"),
      '---\ntitle: Intro\n---\n\nimport { Note } from "./note";\n\n# Introduction\n\n<Note>See [the guide](/docs/guide).</Note>\n',
    );
    const docs = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      pages: { index: "/docs", entry: "/docs/{slug}" },
    });

    expect(await docs.getAgentMarkdown("intro")).toBe(
      'import { Note } from "./note";\n\n# Introduction\n\n<Note>See [the guide](https://example.com/docs/guide).</Note>\n',
    );
  });

  test("quotes every line of a multi-line description, and keeps the title on one line", async () => {
    await writePost(
      "multi",
      '---\ntitle: "Two\\nlines"\ndescription: "First.\\n\\n# Not a heading"\n---\n\nBody.\n',
    );
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("multi")).toBe(
      "# Two lines\n\n> First.\n>\n> # Not a heading\n\nBody.\n",
    );
  });

  test("ends every line with LF when the file uses CRLF", async () => {
    await writePost(
      "crlf",
      "---\r\ntitle: CRLF\r\n---\r\n\r\nFirst line.\r\nSecond line.\r\n",
    );
    const { posts } = setup();

    expect(await posts.getAgentMarkdown("crlf")).toBe(
      "# CRLF\n\nFirst line.\nSecond line.\n",
    );
  });

  test("reaches links inside MDX components past qino's {#id} headings", async () => {
    await fs.mkdir(nodePath.join(tmp, "docs"));
    await fs.writeFile(
      nodePath.join(tmp, "docs", "ids.mdx"),
      "---\ntitle: Ids\n---\n\n## Install {#install}\n\n<Card>\n[the guide](/docs/guide)\n</Card>\n",
    );
    const docs = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      pages: { index: "/docs", entry: "/docs/{slug}" },
    });

    expect(await docs.getAgentMarkdown("ids")).toBe(
      "# Ids\n\n## Install {#install}\n\n<Card>\n[the guide](https://example.com/docs/guide)\n</Card>\n",
    );
  });

  test("is the heading and description alone for a JSON entry", async () => {
    await fs.mkdir(nodePath.join(tmp, "authors"));
    await fs.writeFile(
      nodePath.join(tmp, "authors", "jane.json"),
      JSON.stringify({
        title: "Jane",
        description: "Writes the posts.",
        markdown: "A field named markdown is data, not a body.",
      }),
    );
    const qino = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    });
    const authors = qino.defineCollection({
      directory: "authors",
      extension: ".json",
      schema: z.object({
        title: z.string(),
        description: z.string(),
        markdown: z.string(),
      }),
      pages: { index: "/authors", entry: "/authors/{slug}" },
    });

    expect(await authors.getAgentMarkdown("jane")).toBe(
      "# Jane\n\n> Writes the posts.\n",
    );
  });

  test.each(["missing", "../secret", "hello/../hello"])(
    "is null for the slug %j, which names no entry",
    async (slug) => {
      await writePost("hello", "---\ntitle: Hello\n---\n");
      await fs.writeFile(nodePath.join(tmp, "secret.md"), "---\n---\n");
      const { posts } = setup();

      expect(await posts.getAgentMarkdown(slug)).toBeNull();
    },
  );

  test("is null for an entry the view excludes, and the view can be chosen", async () => {
    await writePost("draft", "---\ntitle: Draft\ndraft: true\n---\n\nSoon.\n");
    const qino = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    });
    const posts = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({ title: z.string(), draft: z.boolean().optional() }),
      pages: { index: "/blog", entry: "/blog/{slug}" },
      views: (view) => ({
        default: view({ filter: (post) => !post.draft }),
        all: view({}),
      }),
    });

    expect(await posts.getAgentMarkdown("draft")).toBeNull();
    expect(await posts.getAgentMarkdown("draft", { view: "all" })).toBe(
      "# Draft\n\nSoon.\n",
    );
  });
});
