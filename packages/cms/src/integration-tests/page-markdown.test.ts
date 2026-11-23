import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { parseFrontmatter } from "@qino/tooling/frontmatter";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { ItemPageConfig, PagePath } from "../types/pages";
import { afterFrontmatterBlock } from "./after-frontmatter-block";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-page-md-int-"));
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
    pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
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
        pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
      });

    expect(define).toThrow(
      'Collection "posts" declares pages, so initQino needs a siteUrl, such as "https://example.com".',
    );
  });

  const blog = { index: "/blog", entry: "/blog/{slug}", title: "Blog" };

  test.each([
    [{ ...blog, index: "blog" }, 'pages.index "blog" must start with "/".'],
    [
      { ...blog, index: "//evil.com" },
      'pages.index "//evil.com" must stay on the site.',
    ],
    [
      { ...blog, entry: "/blog/{slug}#top" },
      'pages.entry "/blog/{slug}#top" must be a path, without "?" or "#".',
    ],
    [
      { ...blog, index: "/blog/{slug}" },
      'pages.index "/blog/{slug}" takes no token.',
    ],
    [
      { ...blog, entry: "/blog" },
      'pages.entry "/blog" must contain {slug} once.',
    ],
    [
      { ...blog, entry: "/blog/{slug}/{slug}" },
      'pages.entry "/blog/{slug}/{slug}" must contain {slug} once.',
    ],
    [
      { ...blog, entry: "/blog/{year}/{slug}" },
      'pages.entry "/blog/{year}/{slug}" takes no token but {slug}.',
    ],
    [
      { ...blog, title: undefined },
      'pages.title must name the index page, such as "Blog".',
    ],
  ])("reject %j", (pages, message) => {
    expect(definePages(pages)).toThrow(`Collection "posts": ${message}`);
  });

  test("accept the site root as the index", () => {
    expect(
      definePages({ ...blog, index: "/", entry: "/{slug}" }),
    ).not.toThrow();
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

  test("stay on the site, whatever string the slug is", () => {
    const pages = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "pages",
      extension: ".md",
      schema: z.object({}),
      pages: { index: "/", entry: "/{slug}", title: "Pages" },
    });

    for (const slug of ["/evil.com", "//evil.com", "\\evil.com"]) {
      expect(new URL(pages.getMarkdownUrl(slug)).origin).toBe(
        "https://example.com",
      );
    }
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
      pages: { index: "/blog/", entry: "/blog/{slug}/", title: "Blog" },
    });

    expect(posts.getMarkdownUrl("hello")).toBe(
      "https://example.com/blog/hello.md",
    );
  });

  test("need pages, like page Markdown", async () => {
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
      'Collection "posts" has no pages: declare them to get page Markdown and Markdown URLs.';

    expect(() => posts.getMarkdownUrl("hello")).toThrow(message);
    expect(() => posts.getMarkdownUrl()).toThrow(message);
    await expect(posts.getPageMarkdown("hello")).rejects.toThrow(message);
    await expect(posts.getPageMarkdown()).rejects.toThrow(message);
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

describe("page Markdown for collection entries", () => {
  test("makes the description's site-relative links absolute", async () => {
    await writePost(
      "linked",
      '---\ntitle: Linked\ndescription: "See [setup](/setup),\\nthen ![a chart](/chart.png)."\n---\n\nSome text.\n',
    );
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown("linked"))).toBe(
      "# Linked\n\n> See [setup](https://example.com/setup),\n> then ![a chart](https://example.com/chart.png).\n\nSome text.\n",
    );
  });

  test("adds no heading when the body's H1 follows a link definition", async () => {
    await writePost(
      "defined",
      "---\ntitle: Hello\n---\n\n[guide]: /guide\n\n# Hello, world\n\nSee the [guide].\n",
    );
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown("defined"))).toBe(
      "[guide]: https://example.com/guide\n\n# Hello, world\n\nSee the [guide].\n",
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

    expect(afterFrontmatterBlock(await posts.getPageMarkdown("links"))).toBe(
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

  test("adds no heading when the body's H1 comes after a comment", async () => {
    await writePost(
      "commented",
      "---\ntitle: Hello\n---\n\n<!-- note -->\n\n# Own title\n\nBody.\n",
    );
    const { posts } = setup();

    expect(
      afterFrontmatterBlock(await posts.getPageMarkdown("commented")),
    ).toBe("<!-- note -->\n\n# Own title\n\nBody.\n");
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
      pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("intro"))).toBe(
      'import { Note } from "./note";\n\n# Introduction\n\n<Note>See [the guide](https://example.com/docs/guide).</Note>\n',
    );
  });

  test("quotes every line of a multi-line description, and keeps the title on one line", async () => {
    await writePost(
      "multi",
      '---\ntitle: "Two\\nlines"\ndescription: "First.\\n\\n# Not a heading"\n---\n\nBody.\n',
    );
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown("multi"))).toBe(
      "# Two lines\n\n> First.\n>\n> # Not a heading\n\nBody.\n",
    );
  });

  test("ends every line with LF when the file uses CRLF", async () => {
    await writePost(
      "crlf",
      "---\r\ntitle: CRLF\r\n---\r\n\r\nFirst line.\r\nSecond line.\r\n",
    );
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown("crlf"))).toBe(
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
      pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("ids"))).toBe(
      "# Ids\n\n## Install {#install}\n\n<Card>\n[the guide](https://example.com/docs/guide)\n</Card>\n",
    );
  });

  test("is the frontmatter block, heading and description alone for a JSON entry", async () => {
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
      pages: { index: "/authors", entry: "/authors/{slug}", title: "Authors" },
    });

    expect(await authors.getPageMarkdown("jane")).toBe(
      '---\ntitle: "Jane"\ndescription: "Writes the posts."\ncanonical: "https://example.com/authors/jane"\n---\n\n# Jane\n\n> Writes the posts.\n',
    );
  });

  test.each(["missing", "../secret", "hello/../hello"])(
    "is null for the slug %j, which names no entry",
    async (slug) => {
      await writePost("hello", "---\ntitle: Hello\n---\n");
      await fs.writeFile(nodePath.join(tmp, "secret.md"), "---\n---\n");
      const { posts } = setup();

      expect(await posts.getPageMarkdown(slug)).toBeNull();
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
      pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
      views: (view) => ({
        default: view({ filter: (post) => !post.draft }),
        all: view({}),
      }),
    });

    expect(await posts.getPageMarkdown("draft")).toBeNull();
    expect(
      afterFrontmatterBlock(
        await posts.getPageMarkdown("draft", { view: "all" }),
      ),
    ).toBe("# Draft\n\nSoon.\n");
  });
});

describe("page Markdown for a collection's index page", () => {
  test("opens with the index page's title, then links each entry's Markdown URL with its description", async () => {
    await writePost(
      "hello",
      "---\ntitle: Hello\ndescription: The first post.\n---\n\nHi.\n",
    );
    await writePost("world", "---\ntitle: World\n---\n\nHi.\n");
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown())).toBe(
      "# Blog\n\n- [Hello](https://example.com/blog/hello.md): The first post.\n- [World](https://example.com/blog/world.md)\n",
    );
  });

  test("makes a description's site-relative links absolute in the listing", async () => {
    await writePost(
      "linked",
      "---\ntitle: Linked\ndescription: See [setup](/setup).\n---\n\nHi.\n",
    );
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown())).toBe(
      "# Blog\n\n- [Linked](https://example.com/blog/linked.md): See [setup](https://example.com/setup).\n",
    );
  });

  test("lists the default view's entries in its order", async () => {
    await writePost("a", "---\ntitle: Old\ndate: 2024-01-01\n---\n");
    await writePost("b", "---\ntitle: New\ndate: 2025-01-01\n---\n");
    await writePost(
      "c",
      "---\ntitle: Draft\ndate: 2026-01-01\ndraft: true\n---\n",
    );
    const posts = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({
        title: z.string(),
        date: z.coerce.date(),
        draft: z.boolean().optional(),
      }),
      pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
      views: (view) => ({
        default: view({
          filter: (post) => !post.draft,
          sort: (a, b) => b.date.getTime() - a.date.getTime(),
        }),
      }),
    });

    expect(afterFrontmatterBlock(await posts.getPageMarkdown())).toBe(
      "# Blog\n\n- [New](https://example.com/blog/b.md)\n- [Old](https://example.com/blog/a.md)\n",
    );
  });

  test("keeps each link on one line, falling back to the slug for the title", async () => {
    await writePost(
      "hello",
      "---\ntitle: Arrays [part 1\ndescription: |\n  Two\n  lines.\n---\n",
    );
    await writePost("untitled", "Hi.\n");
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown())).toBe(
      "# Blog\n\n- [Arrays \\[part 1](https://example.com/blog/hello.md): Two lines.\n- [untitled](https://example.com/blog/untitled.md)\n",
    );
  });

  test("is the heading alone when there are no entries", async () => {
    const { posts } = setup();

    expect(afterFrontmatterBlock(await posts.getPageMarkdown())).toBe(
      "# Blog\n",
    );
  });

  test('leaves the slug "" to the entry pages, where no entry has it', async () => {
    await writePost("hello", "---\ntitle: Hello\n---\n");
    const { posts } = setup();

    expect(await posts.getPageMarkdown("")).toBeNull();
  });
});

describe("Markdown URLs of index pages", () => {
  test("are the index page's URL with .md appended, and /index.md at the site root", () => {
    const { posts } = setup();
    const atRoot = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "posts",
      extension: ".md",
      schema: z.object({}),
      pages: { index: "/", entry: "/{slug}", title: "Pages" },
    });

    expect(posts.getMarkdownUrl()).toBe("https://example.com/blog.md");
    expect(atRoot.getMarkdownUrl()).toBe("https://example.com/index.md");
  });
});

async function writeDoc(slug: string, content: string) {
  const filePath = nodePath.join(tmp, "docs", `${slug}.mdx`);
  await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

function defineDocs() {
  return initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
    siteUrl: "https://example.com",
  }).defineTree({
    directory: "docs",
    extension: ".mdx",
    schema: z.object({ label: z.string(), description: z.string() }),
    titleField: "label",
    pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
  });
}

function defineItem(file: `${string}.md`, page?: PagePath | ItemPageConfig) {
  return initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
    siteUrl: "https://example.com",
  }).defineItem({
    file,
    schema: z.object({ title: z.string().optional() }),
    page,
  });
}

describe("pages on trees", () => {
  test("are checked like a collection's", () => {
    const define = () =>
      initQino({
        contentFolder: tmp,
        mediaFolder: tmp,
        siteUrl: "https://example.com",
      }).defineTree({
        directory: "docs",
        extension: ".mdx",
        schema: z.object({ label: z.string() }),
        titleField: "label",
        pages: { index: "/docs", entry: "/docs", title: "Docs" } as never,
      });

    expect(define).toThrow(
      'Tree "docs": pages.entry "/docs" must contain {slug} once.',
    );
  });

  test("are needed for page Markdown and Markdown URLs", async () => {
    const docs = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineTree({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ label: z.string() }),
      titleField: "label",
    });
    const message =
      'Tree "docs" has no pages: declare them to get page Markdown and Markdown URLs.';

    expect(() => docs.getMarkdownUrl("guide")).toThrow(message);
    expect(() => docs.getMarkdownUrl()).toThrow(message);
    await expect(docs.getPageMarkdown("guide")).rejects.toThrow(message);
    await expect(docs.getPageMarkdown()).rejects.toThrow(message);
  });
});

describe("Markdown URLs of tree entries", () => {
  test("keep a nested slug's slashes", () => {
    expect(defineDocs().getMarkdownUrl("guide/cli")).toBe(
      "https://example.com/docs/guide/cli.md",
    );
  });
});

describe("page Markdown for tree entries", () => {
  test("takes the title from the tree's titleField", async () => {
    await writeDoc(
      "guide",
      "---\nlabel: Guide\ndescription: Start here.\n---\n\nRead [the CLI](/docs/guide/cli).\n",
    );
    await writeDoc(
      "guide/cli",
      "---\nlabel: CLI\ndescription: Commands.\n---\n",
    );
    const docs = defineDocs();

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("guide"))).toBe(
      "# Guide\n\n> Start here.\n\nRead [the CLI](https://example.com/docs/guide/cli).\n",
    );
    expect(afterFrontmatterBlock(await docs.getPageMarkdown("guide/cli"))).toBe(
      "# CLI\n\n> Commands.\n",
    );
  });

  test.each(["missing", "../secret", "guide/../guide"])(
    "is null for the slug %j, which names no node",
    async (slug) => {
      await writeDoc(
        "guide",
        "---\nlabel: Guide\ndescription: Start here.\n---\n",
      );
      await fs.writeFile(
        nodePath.join(tmp, "secret.mdx"),
        "---\nlabel: Secret\ndescription: No.\n---\n",
      );
      const docs = defineDocs();

      expect(await docs.getPageMarkdown(slug)).toBeNull();
    },
  );
});

describe("page Markdown for a tree's index page", () => {
  test("gives each root node a section listing it and its descendants, in tree order", async () => {
    await writeDoc(
      "guide",
      "---\nlabel: Guide\ndescription: Start here.\n---\n",
    );
    await writeDoc(
      "guide/cli",
      "---\nlabel: CLI\ndescription: Commands.\n---\n",
    );
    await writeDoc(
      "guide/cli/flags",
      '---\nlabel: Flags\ndescription: ""\n---\n',
    );
    await writeDoc("api", "---\nlabel: API\ndescription: Reference.\n---\n");
    await fs.writeFile(
      nodePath.join(tmp, "docs", "_order.json"),
      JSON.stringify(["guide.mdx", "api.mdx"]),
    );
    const docs = defineDocs();

    expect(afterFrontmatterBlock(await docs.getPageMarkdown())).toBe(
      [
        "# Docs",
        "",
        "## Guide",
        "",
        "- [Guide](https://example.com/docs/guide.md): Start here.",
        "- [CLI](https://example.com/docs/guide/cli.md): Commands.",
        "- [Flags](https://example.com/docs/guide/cli/flags.md)",
        "",
        "## API",
        "",
        "- [API](https://example.com/docs/api.md): Reference.",
        "",
      ].join("\n"),
    );
    expect(docs.getMarkdownUrl()).toBe("https://example.com/docs.md");
  });
});

describe("page on items", () => {
  test("takes no token", () => {
    expect(() => defineItem("about.md", "/{slug}")).toThrow(
      'Item "about.md": page "/{slug}" takes no token.',
    );
  });

  test("checks the path of its object form as it checks a string", () => {
    expect(() => defineItem("about.md", { path: "about" as PagePath })).toThrow(
      'Item "about.md": page "about" must start with "/".',
    );
    expect(defineItem("about.md", { path: "/about" }).getMarkdownUrl()).toBe(
      "https://example.com/about.md",
    );
  });

  test("needs a siteUrl", () => {
    const define = () =>
      initQino({ contentFolder: tmp, mediaFolder: tmp }).defineItem({
        file: "about.md",
        schema: z.object({}),
        page: "/about",
      });

    expect(define).toThrow(
      'Item "about.md" declares a page, so initQino needs a siteUrl, such as "https://example.com".',
    );
  });

  test("is needed for page Markdown and a Markdown URL", async () => {
    const about = defineItem("about.md");
    const message =
      'Item "about.md" has no page: declare it to get page Markdown and a Markdown URL.';

    expect(() => about.getMarkdownUrl()).toThrow(message);
    await expect(about.getPageMarkdown()).rejects.toThrow(message);
  });
});

describe("Markdown URLs of items", () => {
  test("are their page's URL with .md appended, and /index.md at the site root", () => {
    expect(defineItem("about.md", "/about").getMarkdownUrl()).toBe(
      "https://example.com/about.md",
    );
    expect(defineItem("home.md", "/").getMarkdownUrl()).toBe(
      "https://example.com/index.md",
    );
  });
});

describe("page Markdown for items", () => {
  test("falls back to the file name for the title", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "about.md"),
      "---\ntitle: About us\n---\n\nSee [the team](/team).\n",
    );
    await fs.writeFile(
      nodePath.join(tmp, "untitled.md"),
      "---\n---\n\nBody.\n",
    );

    expect(
      afterFrontmatterBlock(
        await defineItem("about.md", "/about").getPageMarkdown(),
      ),
    ).toBe("# About us\n\nSee [the team](https://example.com/team).\n");
    expect(
      afterFrontmatterBlock(
        await defineItem("untitled.md", "/untitled").getPageMarkdown(),
      ),
    ).toBe("# untitled\n\nBody.\n");
  });
});

describe("frontmatter blocks", () => {
  test("open an entry page's Markdown with its title, description and canonical URL, before the heading, the description and the body without its own frontmatter", async () => {
    await writePost(
      "hello",
      "---\ntitle: Hello\ndescription: A first post.\n---\n\nSome text.\n",
    );
    const { posts } = setup();

    expect(await posts.getPageMarkdown("hello")).toBe(
      '---\ntitle: "Hello"\ndescription: "A first post."\ncanonical: "https://example.com/blog/hello"\n---\n\n# Hello\n\n> A first post.\n\nSome text.\n',
    );
  });

  test("take the title and description from the fields when the body opens with its own H1, which gets no heading", async () => {
    await writePost(
      "titled",
      "---\ntitle: Hello\ndescription: A first post.\n---\n\n# Hello, world\n\nSome text.\n",
    );
    const { posts } = setup();

    expect(await posts.getPageMarkdown("titled")).toBe(
      '---\ntitle: "Hello"\ndescription: "A first post."\ncanonical: "https://example.com/blog/titled"\n---\n\n# Hello, world\n\nSome text.\n',
    );
  });

  test("fall back to the slug for the title when the body opens with its own H1", async () => {
    await writePost("headed", "# Hello, world\n\nSome text.\n");
    const { posts } = setup();

    expect(await posts.getPageMarkdown("headed")).toBe(
      '---\ntitle: "headed"\ncanonical: "https://example.com/blog/headed"\n---\n\n# Hello, world\n\nSome text.\n',
    );
  });

  test("fall back to the slug for the title, and leave out a missing description, as the heading does", async () => {
    await writePost("untitled", "---\n---\n\nSome text.\n");
    const { posts } = setup();

    expect(await posts.getPageMarkdown("untitled")).toBe(
      '---\ntitle: "untitled"\ncanonical: "https://example.com/blog/untitled"\n---\n\n# untitled\n\nSome text.\n',
    );
  });

  test("quote each value, so the YAML reads back the title and description as written", async () => {
    const title = '- Setup: "quick" #1 \\ done';
    const description = "Two lines:\nboth # kept.";
    await writePost(
      "quoted",
      `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n`,
    );
    const { posts } = setup();

    const markdown = (await posts.getPageMarkdown("quoted")) ?? "";
    expect(markdown).toMatch(
      /^---\ntitle: "- Setup: \\"quick\\" #1 \\\\ done"\ndescription: "Two lines: both # kept\."\n/,
    );
    expect(parseFrontmatter(markdown).data).toEqual({
      title,
      description: "Two lines: both # kept.",
      canonical: "https://example.com/blog/quoted",
    });
  });

  test("give an index page its title and canonical URL", async () => {
    await writePost("hello", "---\ntitle: Hello\n---\n\nSome text.\n");
    const { posts } = setup();

    expect(await posts.getPageMarkdown()).toBe(
      '---\ntitle: "Blog"\ncanonical: "https://example.com/blog"\n---\n\n# Blog\n\n- [Hello](https://example.com/blog/hello.md)\n',
    );
  });

  test("give a tree's pages the tree's titles and their URLs, nested slugs included", async () => {
    await writeDoc(
      "guide",
      "---\nlabel: Guide\ndescription: Start here.\n---\n",
    );
    await writeDoc(
      "guide/cli",
      "---\nlabel: CLI\ndescription: Commands.\n---\n",
    );
    const docs = defineDocs();

    expect(await docs.getPageMarkdown("guide/cli")).toBe(
      '---\ntitle: "CLI"\ndescription: "Commands."\ncanonical: "https://example.com/docs/guide/cli"\n---\n\n# CLI\n\n> Commands.\n',
    );
    expect(await docs.getPageMarkdown()).toMatch(
      /^---\ntitle: "Docs"\ncanonical: "https:\/\/example\.com\/docs"\n---\n\n# Docs\n\n## Guide\n/,
    );
  });

  test("give an item its page's URL, the site root included", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "about.md"),
      "---\ntitle: About us\n---\n\nBody.\n",
    );

    expect(await defineItem("about.md", "/about").getPageMarkdown()).toBe(
      '---\ntitle: "About us"\ncanonical: "https://example.com/about"\n---\n\n# About us\n\nBody.\n',
    );
    expect(await defineItem("about.md", "/").getPageMarkdown()).toMatch(
      /^---\ntitle: "About us"\ncanonical: "https:\/\/example\.com\/"\n---\n/,
    );
  });
});
