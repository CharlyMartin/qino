# @qino/cms

## 0.25.0

### Minor Changes

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Removes the `raw` field from Markdown entries. For a page's Markdown to copy or serve, such as a "Copy page as Markdown" button, use `getPageMarkdown`, which needs `pages` (or `page` on an item) and `initQino({ siteUrl })`. For the untouched source file, read it from `_meta.filePath`. This is a breaking change:

  ```diff
  - const markdown = post.raw;
  + // The page's Markdown, or null for a slug with no entry:
  + const markdown = await posts.getPageMarkdown(post._meta.slug);
  + // Items take no slug:
  + const aboutMarkdown = await about.getPageMarkdown();
  + // The source file, frontmatter included:
  + const source = await fs.readFile(post._meta.filePath, "utf8");
  ```

  `raw` is no longer reserved, so Markdown frontmatter, schemas and `augment` can add a `raw` field of their own.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds page Markdown to trees and items, as collections have it. A tree declares `pages` like a collection, and an item declares its one `page`:

  ```ts
  const docs = qino.defineTree({ directory: "docs", titleField: "title", pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" }, … });
  const about = qino.defineItem({ file: "about.md", page: "/about", … });
  ```

  `docs.getPageMarkdown(slug)` titles the entry from the tree's `titleField`, keeps nested slugs such as `guide/cli`, and returns `null` for a slug the tree doesn't list. `about.getPageMarkdown()` returns the item's page Markdown. `docs.getMarkdownUrl(slug)` and `about.getMarkdownUrl()` return their Markdown URLs, and an item at `/` has the Markdown URL `/index.md`.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds page Markdown to collections: a standalone Markdown version of each entry page, to serve to AI agents. Set `siteUrl` in `initQino`, and declare where the collection's pages live with `pages`:

  ```ts
  const qino = initQino({
    contentFolder: "content",
    mediaFolder: "public",
    siteUrl: "https://example.com",
  });

  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".mdx",
    schema,
    pages: { index: "/blog", entry: "/blog/{slug}", title: "Blog" },
  });
  ```

  `posts.getPageMarkdown(slug)` returns a frontmatter block with the entry's `title`, `description` and `canonical` URL, so agents get its metadata without reading the body. Then come the title as a heading, the description as a quote, and the body without its own frontmatter, with site-relative links made absolute:

  ```md
  ---
  title: "Hello"
  description: "The first post."
  canonical: "https://example.com/blog/hello"
  ---

  # Hello

  > The first post.

  The body.
  ```

  Each value in the block is a quoted string, with the description on one line. A body that opens with its own H1 gets no heading, and its block still holds the title and description.

  `getPageMarkdown` takes any string, such as a route param, and returns `null` when the slug is unknown or the view excludes the entry, so it pairs with `negotiateMarkdown`:

  ```ts
  return (
    (await negotiateMarkdown(request, () => posts.getPageMarkdown(slug))) ??
    next()
  );
  ```

  `posts.getMarkdownUrl(slug)` returns the entry's Markdown URL, such as `https://example.com/blog/hello.md`, for `<link rel="alternate">` and `Link` headers.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `cli.build.llmsTxt`, which makes `qino build` write `llms.txt` at the root of `mediaFolder`, from a template you write:

  ```ts
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    siteUrl: "https://example.com",
    cli: { build: { llmsTxt: true } },
  });
  ```

  The template, `content/llms.md` by default or the file `{ template }` names, holds your title, summary and "When to use" section. Its frontmatter is left out. qino adds a link section for each primitive that declares pages: one per tree root node, one per collection under its `pages.title` with the entries its default view keeps, and one `## Pages` section for the items. Sections go before the template's `## Optional` heading, or at the end, ordered trees, then collections, then items, each by path. Each link reads `- [title](Markdown URL): description`.

  `qino build` also writes `index.md`, so the homepage has a Markdown URL: `llms.txt` after a frontmatter block, with the template's H1 as `title`, its summary blockquote on one line as `description`, and `siteUrl` as `canonical`. A template without an H1 gives `index.md` no block. The build skips `index.md` when a page already has `/index.md` as its Markdown URL, such as an item whose `page` is `/`. Both files are rewritten only when they change. The build fails when `siteUrl` is missing or the template doesn't exist.

  On a large site, set `{ sections: true }` to keep `llms.txt` small. `qino build` then also writes a section llms.txt for each collection and tree that declares pages, at its index page's path, such as `public/docs/llms.txt`, listing only that primitive's pages. `llms.txt` links to them under one `## Sections` heading in place of their link sections, and keeps the items' `## Pages`:

  ```md
  ## Sections

  - [Docs](https://example.com/docs/llms.txt)
  - [Blog](https://example.com/blog/llms.txt)
  ```

  A collection or tree with nothing to list still gets one, holding its heading alone. With `sections` on, the build fails for an index page at `/`, since its section llms.txt would replace `llms.txt`, and for two collections or trees with the same index page.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `llms-full.txt` to what `qino build` writes with `cli.build.llmsTxt` on, at the root of `mediaFolder`, so an agent can read every entry page in one request. It opens with the template's H1 and the summary blockquote after it. Then comes the page Markdown of every entry page that `llms.txt`'s link sections list, in their order and as its Markdown URL serves it without the frontmatter block, one blank line apart. Entries the default view excludes are left out. Set `pages.llmsFull: false` to keep a collection or a tree out, such as a very large one:

  ```ts
  qino.defineCollection({
    directory: "changelog",
    extension: ".md",
    schema,
    pages: {
      index: "/changelog",
      entry: "/changelog/{slug}",
      title: "Changelog",
      llmsFull: false,
    },
  });
  ```

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds page Markdown for index pages. Called without a slug, `getPageMarkdown()` on a collection or a tree returns one unpaginated listing that links every entry's Markdown URL, with its description, after a frontmatter block with the index page's title and URL:

  ```md
  ---
  title: "Blog"
  canonical: "https://example.com/blog"
  ---

  # Blog

  - [Hello](https://example.com/blog/hello.md): The first post.
  - [World](https://example.com/blog/world.md)
  ```

  A collection lists the entries its default view keeps, in its order. A tree gives each root node a `##` section that lists the node and then its descendants. The heading is `pages.title`, which `pages` requires. `getMarkdownUrl()` without a slug returns the index page's Markdown URL, such as `https://example.com/blog.md`.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `markdownComponents` to the `pages` of collections and trees: functions, by component name, whose output replaces an MDX component in page Markdown. Each function receives the component's literal `props`, its `children` already converted to Markdown, and the `entry` as read. It returns Markdown, or `null` to keep the component as written:

  ```ts
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".mdx",
    titleField: "title",
    schema,
    pages: {
      index: "/docs",
      entry: "/docs/{slug}",
      title: "Docs",
      markdownComponents: {
        InstallBox: ({ props }) =>
          `\`\`\`sh\nnpm ${props.command ?? "install"} @qino/cms\n\`\`\``,
        // Annotated, because it reads `docs`, whose type it's part of.
        LinkGrid: async ({ entry }): Promise<string> => {
          const node = await docs.getTree(entry._meta.slug);
          return node.children
            .map((child) => `- [${child.title}](/docs/${child.slug}.md)`)
            .join("\n");
        },
      },
    },
  });
  ```

  An item takes the map in the object form of its `page`, `page: { path: "/about", markdownComponents }`, and `page: "/about"` still works. JSON primitives have no body, so they can't set it.

  `props` holds strings, numbers, booleans, `null`, and arrays and objects of them. Attributes set by any other expression are left out, and qino never runs one. A component missing from the map stays as written, and components inside it are still replaced. Replacements are spliced in by position and stay inside their component's list item or blockquote. Their site-relative links are made absolute, as `children`'s already are.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `negotiateMarkdown`, which answers agents that ask for Markdown from any route or middleware that works with Web `Request` and `Response` objects, such as TanStack Start handlers and Next.js route handlers. It serves the Markdown your loader returns when the request's path ends in `.md` or its `Accept` header prefers `text/markdown` to HTML, and resolves to `null` otherwise, so your route renders the HTML page:

  ```ts
  import { negotiateMarkdown } from "@qino/cms";

  const response = await negotiateMarkdown(request, () => loadMarkdown(slug));
  return response ?? renderPage();
  ```

  Responses carry `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`. A loader that returns `null` gets a Markdown 404 linking to `/llms.txt`. It never answers 406.

### Patch Changes

- [#381](https://github.com/CharlyMartin/qino/pull/381) [`2ff8e64`](https://github.com/CharlyMartin/qino/commit/2ff8e64d4c6c73e97ef7c4d397c8b81e4835284b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes reading entries with image fields on serverless hosts, which ship neither `mediaFolder` nor sharp's native binary: `qino build` now records each image in `.qino/images.json` inside the content folder, and a read falls back to it when the file is missing or sharp can't load

- [#376](https://github.com/CharlyMartin/qino/pull/376) [`e243675`](https://github.com/CharlyMartin/qino/commit/e24367557d5e356be22064e48928ae2b00fc1a54) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `qino build`, `qino check` and `qino lint` loading test files in `qino/`, which made them fail on a test that imports its runner, such as `vitest`. Files named `*.test.*`, `*.test-d.*` or `*.spec.*` are now skipped, so tests can sit beside the definitions they test.

- [#367](https://github.com/CharlyMartin/qino/pull/367) [`358e297`](https://github.com/CharlyMartin/qino/commit/358e29712aab8743e1fda557c17795d678091ed7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `_stats` counting `{#id}` heading ids as words. A `{#id}` also stopped the body parsing as MDX, in `.md` files too, so it was counted as plain Markdown, text inside components and inline HTML included. Now `{#id}` is left out, as it already was in `_toc`, and the rest of the body counts as it does without one.

- [#373](https://github.com/CharlyMartin/qino/pull/373) [`e020745`](https://github.com/CharlyMartin/qino/commit/e0207450c4bebe917c61332049094b14465bf99b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `qino check` and `qino build` failing with "Could not parse expression with acorn" on an `.mdx` file with a `{#id}` heading id, while scanning for missing media.

## 0.24.0

### Minor Changes

- [#345](https://github.com/CharlyMartin/qino/pull/345) [`e1682f5`](https://github.com/CharlyMartin/qino/commit/e1682f5dbb862a0d2e2aea004db8d2a707bfb97d) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `incrementalEntries` to `initQino`, for long-running dev servers. On a large collection, every `getEntries` call, and every `getPaginatedEntries` call on a view that filters or sorts, resolved each entry's images and relations again, which took seconds per page under `next dev`.

  ```ts
  export default initQino({
    contentFolder: "src/content",
    mediaFolder: "public",
    incrementalEntries: process.env.NODE_ENV == "development",
  });
  ```

  - Each view keeps its entries, with every file they were built from: the entry's own file, its images, and the relation targets it resolved, with theirs.
  - Each call checks those files with one sync stat each, and builds again only the entries whose files changed, so an edit shows up on the next call.
  - `augment`, `filter`, and `sort` still run on every call. A sync `augment` no longer costs a promise per entry.
  - With the option on, a reused entry skips its relation and media `parse` callbacks, a lazy relation target must always return the same collection, and entries that reference one target can hold different objects for it.

  On 10,000 posts with a stand-in for `next dev`'s async tracking, a repeated call drops from about 3.6 s to about 50 ms, and editing an author of 879 posts costs about 0.4 s. The first call for each view still builds every entry.

  Also changes which error a collection's `getEntries` and `getPaginatedEntries` throw when several entries fail, with or without the option: the first in slug order, and a read or validation error before a relation or `augment` error, instead of whichever failed first.

- [#353](https://github.com/CharlyMartin/qino/pull/353) [`811b403`](https://github.com/CharlyMartin/qino/commit/811b4034cfc79d2a7cb34e1b63415385af6e00fc) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Changes `qino build` to check `qino/_generated/config.json` instead of rewriting it when the `CI` environment variable is set, as on GitHub Actions and Vercel. With `cloud` set, a stale or missing committed `config.json` now fails the build with the same error as `qino check`, so CI runs and deploys catch a schema change that wasn't rebuilt and committed, with no extra step. This is a breaking change for builds that relied on CI regenerating the file: run `qino build` locally and commit `config.json`, or set `CI=false` for a command that should rewrite it.

### Patch Changes

- [#349](https://github.com/CharlyMartin/qino/pull/349) [`43fbb48`](https://github.com/CharlyMartin/qino/commit/43fbb48ff89926fd653ba325983ae6efe298800f) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Improves the first listing call under `next dev` for collections and trees with `markdown.stats` or `markdown.toc`. `next dev` loads the development build of the Markdown parser, which runs several times slower, so qino now ships the parser's production build bundled into its own. Counting characters for `_stats` is also faster. On 10,000 posts with `markdown.stats`, the first call drops from about 16 s to about 11 s.

  Installing `@qino/cms` no longer installs `unified`, `remark-parse`, `remark-gfm`, `remark-mdx`, or the `mdast-util-*` and `micromark-extension-*` packages. A project that imports any of them without listing it in its own `package.json` needs to add it. The bundled packages' licenses ship in `dist/THIRD-PARTY-LICENSES.md`.

## 0.23.1

### Patch Changes

- [#342](https://github.com/CharlyMartin/qino/pull/342) [`014f04c`](https://github.com/CharlyMartin/qino/commit/014f04cd253ea9df9f8a071e87da95846557fa6b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `getEntries` and `getPaginatedEntries` calls that run at the same time sharing entry objects. A top-level change to an entry in one call, such as `post.title = …`, showed up in every call that shared the listing. Each call now gets its own copy of each entry's top-level fields, as calls made one after another already did.

- [#343](https://github.com/CharlyMartin/qino/pull/343) [`85c7145`](https://github.com/CharlyMartin/qino/commit/85c7145269f50e704114cc46badb99dca7164f13) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes two relation bugs in `getEntries`, `getPaginatedEntries`, and `getEntry`:

  - Relations to two primitives over the same directory, such as two collections that parse `people/` apart, resolved to whichever one was read first. Each relation now gets its own target's entry.
  - When several entries referenced the same missing or invalid target, every error named the first entry that reached it. Each error now names its own entry and relation.

## 0.23.0

### Minor Changes

- [#331](https://github.com/CharlyMartin/qino/pull/331) [`286c27e`](https://github.com/CharlyMartin/qino/commit/286c27e3ea748241fea369542d21a5c08084e4b2) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Caches parsed files for trees and items, as collections already do. A file is parsed and validated again only once it changes.

  - `getTree`, `getFlatTree`, `getAncestorNodes`, `getNextNode` and `getPreviousNode` share each file's cached parse with `getEntry` and `getEntries`. A docs page that renders a sidebar, previous and next links, and its own entry no longer re-reads and re-validates the whole tree on every call.
  - Stats and the table of contents are built once per parse, and tree walks never build them.
  - As with collections, tree and item entries can share nested objects between calls, so treat them as read-only. A schema transform that reads data outside its own file runs again only when that file changes.

- [#329](https://github.com/CharlyMartin/qino/pull/329) [`64672a8`](https://github.com/CharlyMartin/qino/commit/64672a85ab3045d7517774842120d23c2f0d403b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `getPaginatedEntries` to collections, for listings too long to render at once. It returns one 1-indexed page of the selected view, with the totals to link the others:

  ```ts
  const { entries, page, perPage, pageCount, total } =
    await postCollection.getPaginatedEntries(2, {
      view: "listing",
      perPage: 24,
    });
  ```

  When the view has no `filter` and no `sort`, only that page's files are read. A page past `pageCount`, or a `page` or `perPage` that isn't a positive integer, throws.

  #### Slug order

  `getEntries` now returns entries in slug order when the view has no `sort`, instead of the order the file system lists them in, and `sort` ties keep that order. Pages stay the same on every call, and every machine returns the same order. Add a `sort` to a view to choose another order.

  #### Parsed files are cached

  Collections now keep each file's parsed, validated entry between calls, and re-read a file only once it changes. Repeated `getEntries` and `getPaginatedEntries` calls, such as one per static page, no longer parse and validate every file again. Images, relations, and views still run on every call.

  - A file counts as changed when its size, modification time, or inode changes. For 2 seconds after an edit, its content is compared too.
  - Entries can now share nested objects between calls, so treat them as read-only.
  - A schema transform that reads data outside its own file, such as another file, runs again only when that file changes. Move that work to a view's `augment`, which runs on every call.

### Patch Changes

- [#332](https://github.com/CharlyMartin/qino/pull/332) [`2656e10`](https://github.com/CharlyMartin/qino/commit/2656e10cf6da9a3dab5f629ef4a535370b98c48d) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Shares work between calls that run at the same time, such as the pages a static build renders at once.

  - `getEntries` and `getPaginatedEntries` calls for the same view share one listing, so the entries are resolved, filtered, and sorted once instead of once per call. Each call still gets its own array.
  - Tree walks share one walk, so a page that calls `getTree`, `getPreviousNode`, and `getNextNode` together lists its files once. Each call still gets its own nodes.
  - A call that starts while another is running gets that run's result, so an edit made during it shows up from the next call on.
  - Tree walks read a folder's files and subfolders at the same time instead of one by one. When several files are invalid, the walk still throws the same error as before.
  - Reads at most 64 content files at once, across trees, collections, items, and `qino check`. On Node 22, a tree or collection of more than about 1,000 files could fail with `EMFILE` under a 1,024 open-file limit, as on AWS Lambda.

## 0.22.1

### Patch Changes

- [#321](https://github.com/CharlyMartin/qino/pull/321) [`21b6d50`](https://github.com/CharlyMartin/qino/commit/21b6d5098ea1954fb5897d349fce68dcb58625ec) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Changes error messages and type errors to write qino in lowercase, e.g. `fields reserved for qino cannot appear in content or schema output`

## 0.22.0

### Minor Changes

- [#318](https://github.com/CharlyMartin/qino/pull/318) [`4e31fdc`](https://github.com/CharlyMartin/qino/commit/4e31fdcf914dd57fdd270a90637ab80f4c6e309b) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `"customFormat": true` to relations and media rules in `config.json` when they have a `parse` callback, which can't be written to JSON. The cloud UI shows those fields read-only, since it can't tell which values the callback reads. `configFileSchema` and `ConfigFile` accept the new field.

  Projects with a `parse` callback get a new `config.json`: run `qino build` after upgrading, or `qino check` reports it out of date.

## 0.21.0

### Minor Changes

- [#314](https://github.com/CharlyMartin/qino/pull/314) [`c645f24`](https://github.com/CharlyMartin/qino/commit/c645f24d92ec060727b5963691f218f0140cf26f) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Rejects frontmatter written in a language other than YAML. A file starting with `---json` or `---js` now fails with `Frontmatter must be YAML: "---json" isn't supported.`; before, `---json` was parsed as JSON and `---js` was evaluated as JavaScript. This is a breaking change: rewrite such frontmatter as YAML.

  ```diff
  - ---json
  - { "title": "Hello" }
  - ---
  + ---
  + title: Hello
  + ---
  ```

  Also drops the `gray-matter` dependency: files are read with `parseFrontmatter` from `@qino/tooling`, the reader the qino cloud UI uses.

## 0.20.0

### Minor Changes

- [#310](https://github.com/CharlyMartin/qino/pull/310) [`93fc7f2`](https://github.com/CharlyMartin/qino/commit/93fc7f2932bcc344d1314a02c27633adfb1fbf5d) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Groups the Markdown body options under `markdown`, the name of the field that holds the body. `media` now only holds frontmatter fields. This is a breaking change: `markdownStats`, `markdownToc`, and `media.markdown` are gone.

  ```ts
  // Before
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: PostSchema,
    markdownStats: true,
    markdownToc: { upTo: "h3" },
    media: {
      cover: { accepted: "image/webp", maxSize: "5MB" },
      markdown: [{ accepted: "image/webp", maxSize: "1MB" }],
    },
  });

  // After
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema: PostSchema,
    media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
    markdown: {
      stats: true,
      toc: { upTo: "h3" },
      media: [{ accepted: "image/webp", maxSize: "1MB" }],
    },
  });
  ```

  `markdown.media` takes one rule or a list. Each body rule can now have a `parse`, like a media field: `qino check` reads each image with every rule's own `parse`, and the image passes when one rule matches. The body itself is still read as written.

  Any `markdown` on a JSON primitive is a type error, and throws at definition. `media.markdown` throws with a pointer to `markdown.media`. `config.json` is unchanged: body rules are still listed under `media.markdown`.

  The `MediaRule`, `MediaSize`, and `MarkdownConfig` types are exported.

## 0.19.0

### Minor Changes

- [#307](https://github.com/CharlyMartin/qino/pull/307) [`bb31cab`](https://github.com/CharlyMartin/qino/commit/bb31cab4511176be15b6e32312aed57db01bed3e) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds `markdownToc` to Markdown and MDX collections, trees, and items. It adds a `_toc` field to each entry: the body's headings in document order, as `{ heading, id, text }`. The ids match the ones `rehype-slug` gives the rendered headings. Set `true` to list every heading, or `{ upTo: "h3" }` to stop at a level:

  ```ts
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".mdx",
    schema: DocSchema,
    titleField: "title",
    markdownToc: { upTo: "h3" },
  });

  (await docs.getEntry("install"))._toc;
  // [{ heading: 2, id: "requirements", text: "Requirements" }, …]
  ```

  A heading ending in `{#id}` keeps that id, as with `remark-custom-heading-id`. For sites that make ids their own way, `slug` turns each heading's text into its id:

  ```ts
  markdownToc: { upTo: "h4", slug: (text) => text.replace(/[^a-zA-Z0-9]/g, "") },
  ```

  `text` leaves out MDX components, so ``## `watch`: <TypeText>() => T</TypeText>`` reads `watch:`.

  `_toc` is now reserved in Markdown schemas and frontmatter, like `_stats`. The `MarkdownToc` and `MarkdownTocHeading` types are exported.

## 0.18.0

### Minor Changes

- [#291](https://github.com/CharlyMartin/qino/pull/291) [`5760940`](https://github.com/CharlyMartin/qino/commit/57609403a7185c4b2be5ad2dc18e05d2455eb2a8) Thanks [@{](https://github.com/{)! - Changes how relations resolve: declared relations now resolve by default, each relation sets its own depth, and views set depths by relation with `resolveDepth`, which replaces `resolveRelations`. This is a breaking change.

  #### Relations resolve by default

  Views used to leave relations as strings unless they set `resolveRelations`. Now every view, including the implicit default, resolves each relation to its `resolveDepth`, which defaults to `1`: `post.author` is the author entry, and the author's own relations stay strings. To keep a relation a string everywhere, declare it with `resolveDepth: 0`.

  #### `resolveDepth` on relations

  A relation can be declared as an object to set how many hops it resolves, from `0` (keep the string) to `6`:

  ```ts
  relations: {
   target: authorCollection, resolveDepth: 2 },
    related: { target: () => postCollection, resolveDepth: 0 },
  },
  ```

  A nested relation never resolves further than the hops left from its parent.

  #### `resolveDepth` in views replaces `resolveRelations`

  A view sets the depth of the relations it lists, keyed by relation path. Relations it leaves out use their own `resolveDepth`, and a depth the view sets applies to the whole branch below that relation. A path that isn't a relation, or a depth outside `0` to `6`, is a type error and throws at definition:

  ```diff
  - detail: view({ resolveRelations: 2 }),
  + detail: view({ resolveDepth: { author: 2 } }),
  - raw: view({ resolveRelations: false }),
  + raw: view({ resolveDepth: { author: 0, "categories[*]": 0 } }),
  - full: view({ resolveRelations: true }),
  + full: view({ resolveDepth: { author: 6, "categories[*]": 6 } }),
  ```

  `view()` throws when given `resolveRelations`, and getters throw on `resolveDepth` as they did on `resolveRelations`: select a view instead.

- [#292](https://github.com/CharlyMartin/qino/pull/292) [`7d5f883`](https://github.com/CharlyMartin/qino/commit/7d5f883f95587f6c635cb64b98bd7addf5c6a1d9) Thanks [@{](https://github.com/{)! - Adds `parse` to relations and media fields, to read content that can't follow qino's path conventions, such as an Obsidian vault linking notes with `[[Jane Doe]]`. `parse` turns a raw value into a content path or a media URL, which qino then checks and reads as usual. Return `undefined` to read the value as is:

  ```ts
  relations: {

      target: authorCollection,
      parse: (value, { target }) => {
        const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
        if (!name || target.is == "item") return undefined;
        return `${target.directory}/${name}${target.extension}`;
      },
    },
  },
  media: {
    cover: {
      accepted: "image/png",
      maxSize: "5MB",
      parse: (value) => {
        const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
        return name ? `/${encodeURIComponent(name)}` : undefined;
      },
    },
  },
  ```

  A media field's parsed URL replaces its value, including `QinoImage.src`, and `qino check` checks it. The `RelationParse` and `MediaParse` types are exported for callbacks declared on their own.

## 0.17.1

### Patch Changes

- [#286](https://github.com/CharlyMartin/qino/pull/286) [`9fc3bbb`](https://github.com/CharlyMartin/qino/commit/9fc3bbbb5402a52475cb51b8e974a000d6f76ba7) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Fixes `qino check` scanning `node_modules` for media references when `contentFolder` is `"."`. Trees also skip `node_modules` and dot-folders such as `.git`

## 0.17.0

### Minor Changes

- [#278](https://github.com/CharlyMartin/qino/pull/278) [`091c7ed`](https://github.com/CharlyMartin/qino/commit/091c7ed59ba12d38fd415d7d35914931e63c46fe) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `getEntries` and `getAncestorNodes` to trees. `getEntries` reads every entry in reading order with the selected view, for sitemaps, search indexes, and feeds. `getAncestorNodes` returns the nodes above a slug, from the root down, for breadcrumbs:

  ```ts
  const entries = await docsTree.getEntries();
  const ancestors = await docsTree.getAncestorNodes(
    "guides/mutations/optimistic",
  );
  // TreeNodes for "guides" and "guides/mutations"
  ```

## 0.16.0

### Minor Changes

- [#265](https://github.com/CharlyMartin/qino/pull/265) [`845e573`](https://github.com/CharlyMartin/qino/commit/845e5732d44dc016a219e616da91dcf87b245aaa) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `markdownStats` option to `defineCollection`, `defineTree`, and `defineItem`. On Markdown and MDX primitives, `markdownStats: true` adds a typed `_stats` field (`wordCount`, `proseCharacterCount`, `sourceCharacterCount`) to every entry, related entries included. The Markdown parsers only load when it's on. `MarkdownStats` is now exported from `@qino/cms`.

  Removes `@qino/cms/utils` and `getMarkdownStats`. `_stats` is now reserved in Markdown frontmatter and schemas. This is a breaking change:

  ```diff
  - import { getMarkdownStats } from "@qino/cms/utils";
  -
    export const postCollection = qino.defineCollection({
      directory: "posts",
      extension: ".md",
      schema: PostSchema,
  +   markdownStats: true,
      views: (view) => ({
        default: view({
  -       augment: (post) => {
  -         const stats = getMarkdownStats(post.markdown);
  -         return { readingMinutes: Math.ceil(stats.wordCount / 220) };
  -       },
  +       augment: (post) => ({
  +         readingMinutes: Math.ceil(post._stats.wordCount / 220),
  +       }),
        }),
      }),
    });
  ```

## 0.15.0

### Minor Changes

- [#259](https://github.com/CharlyMartin/qino/pull/259) [`1179ac6`](https://github.com/CharlyMartin/qino/commit/1179ac658f0998399ca924a297bca1e510acc513) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames `cloud.saveAs` to `cloud.saveEntryAs`, matching `displayEntryAs` and `media.saveFileAs`. `config.json` writes `saveEntryAs` too:

  ```diff
   cloud: {
     displayEntryAs: "{title}",
  -  saveAs: "{title}",
  +  saveEntryAs: "{title}",
   },
  ```

## 0.14.0

### Minor Changes

- [#257](https://github.com/CharlyMartin/qino/pull/257) [`dd61b16`](https://github.com/CharlyMartin/qino/commit/dd61b1638c534a774a9317422f1033afd9fad8d8) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `media` option to `defineCollection`, `defineTree`, and `defineItem`. It declares media fields by path, each with one accepted MIME type and a `maxSize`. Image fields are now read as a `QinoImage`, with `width`, `height`, and a blur placeholder, ready for `next/image`:

  ```ts
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    media: {
      cover: { accepted: "image/webp", maxSize: "5MB" },
      markdown: [
        { accepted: "image/webp", maxSize: "1MB" },
        { accepted: "image/png", maxSize: "1MB" },
      ],
    },
  });

  const post = await posts.getEntry("hello");
  <Image src={post.cover} alt="" placeholder="blur" />;
  ```

  `markdown` lists the rules body images must match, one type per rule. `qino check` verifies every media field and body image: a file in `mediaFolder`, of the accepted type, under its `maxSize`. Images are read with sharp, loaded only when an entry has an image field.

  This is a breaking change. Media config moves out of `cloud`:

  - `initQino`'s `cloud.media` is removed.
  - A primitive's `cloud.media.fields` and `cloud.media.accepted` are replaced by the top-level `media`.
  - `cloud.media.saveAs` is renamed `cloud.media.saveFileAs`, and takes a new `{field}` token.

  ```diff
   initQino({
     contentFolder: "src/content",
     mediaFolder: "public",
     cloud: {
       publish: { mode: "open_pull_request", reviewBeforePublish: true },
  -    media: { accepted: [{ type: "image/webp", maxSize: "5MB" }] },
     },
   });

   qino.defineCollection({
     directory: "posts",
     extension: ".md",
     schema,
  +  media: { cover: { accepted: "image/webp", maxSize: "5MB" } },
     cloud: {
  -    media: { saveAs: "posts/{name}-{hash}", fields: ["cover"] },
  +    media: { saveFileAs: "posts/{name}-{hash}" },
     },
   });
  ```

  `cover` is now a `QinoImage`; read its URL from `cover.src`. In `config.json`, each primitive lists its `media` with sizes in bytes, and `cloud.media` holds only `saveFileAs`. The `@qino/tooling` schemas match.

  Also fixes reading an entry whose relation array is `null`, such as `categories: null` with a `"categories[*]"` relation: it now stays `null` instead of throwing.

## 0.13.1

### Patch Changes

- [#249](https://github.com/CharlyMartin/qino/pull/249) [`1481086`](https://github.com/CharlyMartin/qino/commit/14810863ec84497684526069dedb8d2c34f84286) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Replaces the `fast-glob` dependency with `tinyglobby`, dropping `braces` (GHSA-vfj7-8cjw-p6xm) from the dependency tree

## 0.13.0

### Minor Changes

- [#229](https://github.com/CharlyMartin/qino/pull/229) [`27d7940`](https://github.com/CharlyMartin/qino/commit/27d794096c09ee746e443418304e5417a7c4949d) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds two optional `cloud` options for naming things in the cloud UI, both written to `config.json`:

  - `displayAs` names the primitive itself, such as `"Blog posts"`. It's a plain string and defaults to the id. An item is a single entry, so this also names its entry.
  - `displayEntryAs` labels each entry of a collection or tree from its fields, using the same `{field}` tokens as `saveAs`. Unset, collections show the slug and trees fall back to `titleField`.

  ```ts
  qino.defineCollection({
    directory: "authors",
    schema,
    extension: ".json",
    cloud: {
      displayAs: "Authors",
      displayEntryAs: "{firstName} {lastName}",
    },
  });
  ```

## 0.12.0

### Minor Changes

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - **Breaking:** `media.saveAs` no longer takes the extension, like an entry's `saveAs`: the cloud UI adds the uploaded file's. The `{ext}` token is gone, and the default is now `"{id}/{name}-{hash}"`. `qino build` fails on a `.` in the file name.

  To upgrade, remove `.{ext}` from `media.saveAs`, then rerun `qino build` and commit `config.json`:

  ```diff
  - media: { saveAs: "posts/{name}-{hash}.{ext}" },
  + media: { saveAs: "posts/{name}-{hash}" },
  ```

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `cloud.saveAs` to `defineCollection` and `defineTree`: how the cloud UI names the file of a new entry, from its fields. It uses the same `{token}` syntax as `media.saveAs`, with top-level fields as tokens:

  ```ts
  qino.defineCollection({
    directory: "authors",
    extension: ".json",
    schema,
    cloud: { saveAs: "{firstName}-{lastName}" }, // jane-doe.json
  });
  ```

  Tokens must be required string, number, or boolean fields. An unknown or optional field, a `/` or `.`, or a pattern without a token is a type error, and `qino build` checks the same rules.

### Patch Changes

- [#227](https://github.com/CharlyMartin/qino/pull/227) [`7000df9`](https://github.com/CharlyMartin/qino/commit/7000df9f269e88474a29384ce0338cc5b150846c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Fixes `qino build` rejecting `sortableBy`, `media.fields`, and `saveAs` fields narrowed by an intersection, such as `z.unknown().and(z.string())`: intersections now narrow a field's types instead of adding them up.

## 0.11.0

### Minor Changes

- [#225](https://github.com/CharlyMartin/qino/pull/225) [`4cab8c8`](https://github.com/CharlyMartin/qino/commit/4cab8c85ca8770a00d9ff7a26f9056c2eb1abd18) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds three cloud UI options, written to `qino/_generated/config.json`:

  - `cloud.publish.reviewBeforePublish` on `initQino` also takes an object, which turns review on and configures it. Its `bypassIfAdmin` lets admins publish before every entry is approved, `false` by default. In `config.json`, `reviewBeforePublish` is now `false` or the review settings, `true` becoming `{ "bypassIfAdmin": false }`.
  - `cloud.hiddenFields` on `defineCollection`, `defineTree`, and `defineItem` hides optional fields from the cloud UI. Required fields are a type error.
  - `cloud.media.fields` marks the fields edited with a media picker, as relation paths to strings. A path that's also a relation fails `qino build`.

  ```ts
  qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
    cloud: {
      hiddenFields: ["notes"],
      media: { fields: ["cover", "gallery[*]"] },
    },
  });
  ```

  `config.json` gains these keys, so run `qino build` and commit it, or `qino check` reports it as out of date.

  Fixes `qino build` accepting a `sortableBy` field that's a string in one branch of a union schema but an array or object in another. Every branch must now allow only scalars.

## 0.10.0

### Minor Changes

- [#223](https://github.com/CharlyMartin/qino/pull/223) [`c2b4bc5`](https://github.com/CharlyMartin/qino/commit/c2b4bc566bab5de39ba0a90efd16fa283375c32b) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds `cli.build.types` to `initQino`. Set it to `false` to make `qino build` skip writing `qino/_generated/types.d.ts`. Defaults to `true`.

  ```ts
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cli: { build: { types: false } },
  });
  ```

## 0.9.0

### Minor Changes

- [#218](https://github.com/CharlyMartin/qino/pull/218) [`83f0269`](https://github.com/CharlyMartin/qino/commit/83f0269845cbecf8172ca0c03a94a29a3712a1e0) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Moves `checkLocalAssetReferences` on `initQino` to `cli.check.localAssetReferences`, so CLI options are namespaced by command. This is a breaking change:

  ```diff
   initQino({
     contentFolder: "src/content",
     mediaFolder: "public",
  -  checkLocalAssetReferences: { exclude: ["/og/**"] },
  +  cli: {
  +    check: { localAssetReferences: { exclude: ["/og/**"] } },
  +  },
   });
  ```

## 0.8.0

### Minor Changes

- [#216](https://github.com/CharlyMartin/qino/pull/216) [`62bfc33`](https://github.com/CharlyMartin/qino/commit/62bfc33aab054d85840f443d6ffcf644932d0a92) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `cloud` option to `initQino`, `defineCollection`, `defineTree`, and `defineItem` to configure the qino cloud UI: publish mode, review, accepted uploads, searchable and sortable fields, and where media lands. Values are written, resolved, into `qino/_generated/config.json`.

  ```ts
  initQino({
    contentFolder: "content",
    mediaFolder: "public",
    cloud: {
      publish: { mode: "open_pull_request", reviewBeforePublish: true },
      media: { accepted: [{ type: "image/*", maxSize: "5MB" }] },
    },
  });

  qino.defineCollection({
    // ...
    cloud: {
      searchableBy: ["title"],
      sortableBy: ["title"],
      media: { saveAs: "posts/{name}-{hash}.{ext}" },
    },
  });
  ```

  Removes `buildConfigFile`: setting `cloud` now writes `config.json`. This is a breaking change:

  ```diff
   initQino({
     contentFolder: "content",
     mediaFolder: "public",
  -  buildConfigFile: true,
  +  cloud: {
  +    publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
  +  },
   });
  ```

## 0.7.0

### Minor Changes

- [#199](https://github.com/CharlyMartin/qino/pull/199) [`c991a5f`](https://github.com/CharlyMartin/qino/commit/c991a5f0a25386bc8c5e7abe8c11a53cbd2672c2) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `buildConfigFile` option to `initQino` and flattens its config. This is a breaking change.

  #### Flat `initQino` config

  `media.folder` becomes `mediaFolder` and `media.checkReferences` becomes `checkLocalAssetReferences`, with the same values and defaults:

  ```diff
   initQino({
     contentFolder: "src/content",
  -  media: {
  -    folder: "public",
  -    checkReferences: { exclude: ["/og/**"] },
  -  },
  +  mediaFolder: "public",
  +  checkLocalAssetReferences: { exclude: ["/og/**"] },
   });
  ```

  #### `buildConfigFile`

  When enabled, `qino build` also writes `qino/_generated/config.json`, a committable description of the project: config, every collection, item, and tree with its body format (`markdown`, `mdx`, or `null` for JSON), its schema as JSON Schema (draft 2020-12), and its relations. `qino check` fails when the committed file is missing or out of date.

  ```ts
  export default initQino({
    contentFolder: "src/content",
    mediaFolder: "public",
    buildConfigFile: true,
  });
  ```

  Schemas are converted through Standard JSON Schema, which Zod 4.2+ implements. `qino build` fails when a schema can't be converted, when a transform renames or changes the value of a relation field or `titleField`, or when a relation targets a primitive that isn't exported from `qino/`.

## 0.6.0

### Minor Changes

- [#197](https://github.com/CharlyMartin/qino/pull/197) [`2a58658`](https://github.com/CharlyMartin/qino/commit/2a58658fd5ab64e38725415b18c9568e1c15e315) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Replaces `mediaFolder` with a `media` option on `initQino` and adds a media check to `qino check` and `qino build`. This is a breaking change:

  ```diff
    initQino({
      contentFolder: "content",
  -   mediaFolder: "public",
  +   media: { folder: "public" },
    });
  ```

  Every root-relative URL with a file extension in content must now exist in `media.folder`. The check scans Markdown images and links, `src`/`poster` attributes, and frontmatter or JSON values. Missing files are listed with their `file:line`. Exclude files served by routes, or turn the check off:

  ```ts
  media: {
    folder: "public",
    checkReferences: { exclude: ["/og/**", "/feed.xml"] }, // or `false`
  },
  ```

## 0.5.1

### Patch Changes

- [#178](https://github.com/CharlyMartin/qino/pull/178) [`01f4e5a`](https://github.com/CharlyMartin/qino/commit/01f4e5ab068ebbe043a9a5ef7a9d7e85f2aac8a0) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Shortens the package README and points `homepage` to the documentation at [www.qino.works](https://www.qino.works)

## 0.5.0

### Minor Changes

- [#175](https://github.com/CharlyMartin/qino/pull/175) [`5e345f6`](https://github.com/CharlyMartin/qino/commit/5e345f62a4ed0cb4dd95c6c70b52872bc89e2973) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Changes paths in `defineCollection`, `defineTree`, `defineItem`, and relation values to one convention: relative to `contentFolder`, with no leading `/`. A leading `/` is now a type error in definitions and a runtime error with a suggested fix. This is a breaking change:

  ```diff
  - defineCollection({ directory: "/posts", ... });
  - defineItem({ file: "/pages/home.md", ... });
  + defineCollection({ directory: "posts", ... });
  + defineItem({ file: "pages/home.md", ... });
  ```

  ```diff
  - author: "/authors/jane.json"
  + author: "authors/jane.json"
  ```

  A primitive at the content root uses `directory: ""` instead of `"/"`. Rerun `qino build` to regenerate `qino/_generated/types.d.ts`. `QinoSlugRegistry` keys are now `"posts"` instead of `"/posts"`.

  Relation values can also be root paths that go through `contentFolder`, like `src/content/authors/jane.json` or `apps/site/src/content/authors/jane.json`. Repos edited with Git-based CMSs such as Decap CMS, which store paths from the repository root, keep working.

- [#173](https://github.com/CharlyMartin/qino/pull/173) [`ef99311`](https://github.com/CharlyMartin/qino/commit/ef99311a4a301425a42d29887afac8c66ddeac0c) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Changes `markdown` and `raw` on Markdown entries to be added after validation, like `_meta`. Schemas now validate frontmatter only, so they no longer need to declare either field, and strict objects work as-is. A file without frontmatter can use `z.object({})`. Both fields are still there in getters, views, and resolved relations.

  This is a breaking change. In `.md`, `.mdx`, and `.markdown` entries, `markdown` and `raw` are now reserved schema keys. Declaring them is a type error, and an old schema that still requires them fails validation with a hint naming them. Remove them from Markdown schemas, and move any schema transform of `markdown` into a view `augment`:

  ```diff
    qino.defineCollection({
      directory: "/posts",
      extension: ".md",
      schema: z.object({
        title: z.string(),
  -     markdown: z.string(),
  -     raw: z.string(),
      }),
    });
  ```

  JSON entries are unchanged: there, `markdown` and `raw` are still ordinary fields.

## 0.4.1

### Patch Changes

- [#170](https://github.com/CharlyMartin/qino/pull/170) [`f3df948`](https://github.com/CharlyMartin/qino/commit/f3df948a685d9db694e6efef78b83424060dcf0b) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Fixes `qino lint`, `qino check`, and `qino build` failing to resolve tsconfig path aliases in the instance, definitions, and their imports, including paths inherited through `extends`.

## 0.4.0

### Minor Changes

- [#163](https://github.com/CharlyMartin/qino/pull/163) [`a295736`](https://github.com/CharlyMartin/qino/commit/a295736f3f6de3907f47df60c1ca07ad7c123a16) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Adds a `raw` field to Markdown entries holding the untouched source file, frontmatter included. Declare it in the schema to keep it:

  ```ts
  schema: z.object({
    title: z.string(),
    markdown: z.string(),
    raw: z.string(),
  });
  ```

  `raw` is now reserved on Markdown entries: it cannot appear in frontmatter or be added by `augment`. Strict schemas (`z.strictObject`) must declare it:

  ```diff
    z.strictObject({
      markdown: z.string(),
  +   raw: z.string(),
    })
  ```

## 0.3.0

### Minor Changes

- [#154](https://github.com/CharlyMartin/qino/pull/154) [`656cf63`](https://github.com/CharlyMartin/qino/commit/656cf631792fdbf9e4bfce4a94b81857929c0c47) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames collection and item getters so every primitive reads entries with `getEntry`. This is a breaking change:

  ```diff
  - await posts.getMany();
  - await posts.getOne("hello-world");
  - await home.getData();
  + await posts.getEntries();
  + await posts.getEntry("hello-world");
  + await home.getEntry();
  ```

## 0.2.0

### Minor Changes

- [#152](https://github.com/CharlyMartin/qino/pull/152) [`4c19eb4`](https://github.com/CharlyMartin/qino/commit/4c19eb40cb3a713e1dfa30f28ac8bcf352864a05) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Renames `createQino` to `initQino`. This is a breaking change: replace `createQino` imports and calls with `initQino`. CLI error messages now name `initQino()`.

## 0.1.0

### Minor Changes

- [#115](https://github.com/CharlyMartin/qino/pull/115) [`f886aae`](https://github.com/CharlyMartin/qino/commit/f886aaef7865e65ea9318df5ea21a557837005f1) Thanks [@CharlyMartin](https://github.com/CharlyMartin)! - Initial public release. `@qino/cms/utils` exposes `markdown` and the `MarkdownStats` type only; `assertDirectory`, `assertFile`, `isDirectory`, `isFile`, and `removeLeadingSlash` are internal.
