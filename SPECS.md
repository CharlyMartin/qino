# SPECS for qino

Qino is a flat-file Markdown CMS that aims at providing a great experience for both developers and content editors. It has two components: an npm package for people comfortable with IDEs (developers) and a cloud-based UI for people who prefer to work in the browser (content editors).

## Benefits of flat-file Markdown CMS

1. Markdown files are portable, durable, and easy to move between tools without vendor lock-in.
2. Local files support offline work, plain-text version control, and strong data ownership/privacy because your content stays under your control rather than inside a SaaS database.

## Set-up

In the root of the app, there's a `qino` folder with the following files:

```tree
├── qino
│   ├── config.ts
|   ├── qino-lock.json
│   ├── collections
│   │   ├── posts.ts
│   │   └── events.ts
│   ├── pages
│   │   ├── blog.ts
│   │   └── home.ts
|   └── trees
│       ├── docs.ts
```

Or this architecture:

```tree
├── qino
│   ├── config.ts
|   ├── qino-lock.json
│   ├── collections.ts
│   ├── pages.ts
|   └── trees.ts
```

Maybe both will be supported. TBD.

### Create Config

`qino/config.ts` is where developers define global configuration for the CMS, such as where content and media files live in the consumer app. Having these values set here means other CMS functions are context-aware and can only mention relative paths, which will get resolved to absolute paths in the consumer app by prepending to `contentFolder` and `mediaFolder`.

`createConfig` is a passthrough function which returns the config untouched. It exists to type-check config file and export the information to `qino-lock.json`.

`qino/config.ts` is not called by the consumer app when running the `dev` or `build` commands, so it needs to be called explicitly, which is one of the tasks of the CLI.

```ts
import { createConfig } from "qino";

export default createConfig({
  contentFolder: "src/content",
  mediaFolder: "public",
});
```

For now, the config file is lightweight but will most likely contain more fields in the future, such as:

- `i18n: boolean`, to be able to have multiple languages in the CMS

#### `qino-lock.json`

The `qino-lock.json` file is a JSON file that contains the schema of all the collections and the pages of the project, as well as the config.

It has 2 main purposes:

1. It's used by collection, page and tree getters to know where some of the data lives and what the relations are between collections.
2. The `qino-lock.json` would be published on GitHub with the project. Then, the cloud-based UI for qino would read that file from GitHub to know create the dashboard

### Create Collections

`collections.ts` or `collections/*.ts` is where developers define the collections of content in their app.

```ts
import { createCollection } from "qino";

export const { getAll: getPosts, getOne: getPost } = createCollection({
  id: "posts", // Optional. If omitted, the path will be used as the id.
  path: "posts", // Relative to the root of the app.
  format: ".md", // .md or .mdx or .json. The transformation from Markdown to HTML doesn't happen here, it happens using the component.
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    tags: z.array(z.string())
    author: z.string(),
  }),
});
```

### Create Pages

TODOTODO
TODOTODO
TODOTODO
TODOTODO

```ts
import { createPage } from "qino";
import { z } from "zod";

export const getHomePage = createPage({
  file: "pages/home.md",
  schema: z.object({}),
});
```

### Create Trees

TODOTODO
TODOTODO
TODOTODO
TODOTODO

## How to use QINO getters in the consumer app

```tsx
import { getPosts } from "@/qino/collections";

export default async function Posts() {
  const posts = await getPosts({
    first: 10,
    last: 10,
    sort: () => {}, // a function of array of functions
    filter: () => {}, // a function of array of functions
  });

  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.slug}>
          <a href={`/posts/${post.slug}`}>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}
```

```tsx
import { getPosts } from "@/qino";

export default async function Post({ slug }) {
  const posts = await getPost({ slug });

  return (
    <main>
        <h1>{post.title}</slug>
    </main>
  );
}
```

## CLI

QINO comes with a CLI for developers. It has the following command:

### `qino build`

The `build` command does the following things:

1. updates `qino-lock.json` with the schema from all the collections and the pages based on the current state of the project.

### `qino dev`

The `dev` command is basically a combination of `build` and `watch`. It watches for changes in the collections, pages, trees, config, and the CLI itself and updates the `qino-lock.json` file accordingly. It has some hot-reloading mechanism so that changes are instantly taken into account.

If it's a TS project, the CLI command would also generate types dynamically based on the project's content data, just like Next.js 16 does with typed-routes in `.next/types/routes.d.ts`.

QINO would generate an `.types/index.d.ts` file with a few useful types:

```ts
// This file is autogattered by the CLI
type BlogSlug = "a-blog-title" | "another-blog-title" | {};
type EventSlug = "an-event" | "another-event" | {};

type GetOneBlogParams<Slug extends BlogSlug = string>
type GetOneEventParams<Slug extends EventSlug = string>
```

## TODO and things to solve (Features)

### Make managing relationships between collections easy

[Chat](https://claude.ai/share/1e6441ad-446b-4076-855c-17305878d596)

A big pain point for using Markdown file as a CMS is managing relationships between collections. QINO should solve that pain point. There are a few we could solve that problem.

Here are the things the developer should be able to tell QINO to make this work optimally:

1. That a given string is a path to a collection. `z.string()` is too weak, we need a way to know it's a path.
2. That it should be of a certain extension, like `.md` or `.json` or `.mdx`.
3. That is should resolve a single item or a collection of items.

```ts
import { createCollection } from "qino";
import z from "zod";

const posts = createCollection({
  schema: z.object({
    title: z.string(),
    author: z.qino().path("authors").extension(".json"),
    categories: z.array(z.qino().path("categories").extension(".json")),
  }),
});
```

QINO could export a `Path` object that would be used to define relationships between collections:

```ts
import { createCollection, Path } from "qino";

const posts = createCollection({
  schema: z.object({
    title: z.string(),
    author: Path.to("authors").extension(".json"),
    categories: Path.to("categories").extension(".json"),
  }),
});
```

### Fecthing relationships between collections

Once relationships are defined, the consumer app should be able to resolve these relationships, both downstream and upstream.

```ts
import { createCollection } from "qino";

const { getAll: get Posts} = createCollection({
  schema: z.object({}),
  resolveDescendants: 1 | 2 | 3 | true, // true means all descendants. A number means the number of levels to resolve.
  resolveAncestors: 1 | 2 | 3 | true, // true means all ancestors. A number means the number of levels to resolve.
});
```

`resolveDescendants` and `resolveAncestors` can be defined at the `createCollection` level or called in the getter functions, which getter functions having precedence over the `createCollection` level. Other names to consider for this API:

- `resolveDownstream` and `resolveUpstream`
- `resolveChildren` and `resolveParents`
- `resolveDirect` and `resolveIndirect`

Let's say we have a `posts` collection and a `people` collection. A post has one author, and an author has many posts. In the Markdown CMS, this would be represented in the `posts/**.md` entries, where they would have a frontmatter field `author: people/author-slug.md`. In the `posts/**.md` entries, there would be no reference of which posts were written by which author. Hence the following functions would behave like this:

In the consumer app, we would have a `getPost` function that would return the post and the author.

```ts
const posts = await getPosts({ resolveDescendants: true });
// This would return an array of posts, each containing a author field with the full author object.

const authors = await getAuthors({ resolveAncestors: true });
// This would return an array of authors, each containing a posts field with all the posts written by that author.
```

### Managing ordering of collections

Collections ordering will most likely be by dates, sometimes alphabetically. The `sort` field, optional, should take a function that will be called on every entry in the collection using [`toSorted`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted).

```ts
import { createCollection } from "qino";

// Example of sorting by date
createCollection({
  sort: function sortByDate(a, b) {
    if (a.createdAt < b.createdAt) return -1;
    if (a.createdAt > b.createdAt) return 1;
    return 0;
  },
});

// Example of sorting alphabetically
createCollection({
  sort: function sortAlphabetically(a, b) {
    if (a.title < b.title) return -1;
    if (a.title > b.title) return 1;
    return 0;
  },
});
```

Perhaps at some point, QINO can expose some sorting callbacks to the consumer app, so they don't have to write their own sorting functions. the `compareAsc` and `compareDesc` functions will be smart enough to figure out the right sorting function based on the data type.

```ts
import { createCollection, compareAsc, compareDesc } from "qino";

createCollection({
  sort: compareAsc,
});
```

Once in a while, a collection will require custom ordering that cannot be done programmatically. In this case, the `sort` field should accept paths to JSON files that will be used to sort the collection. It's important that the file is a JSON file, not a TS file, so the cloud UI can pull it from GitHub to read it and potentially edit it.

```ts
// Example of sorting by a custom field
createCollection({
  sort: "posts/_order.json",
  // Or maybe
  sort: { path: "posts/_order.json" },
});
```

`order.json` would be a list of slugs, like this:

```json
["a-post", "another-post", "yet-another-post"]
```

### Support for multiple locales

The `i18n` field should be able to be set to `true` and the consumer app should be able to have multiple locales.

### Managing images path

Developers should be able to define a few things:

1. Is the image local or remote? If local, the CMS can verify that the path is valid and corresponds to a file in the `mediaFolder`.
2. What should the extension be? So that the CMS can validate that the string contains a valid extension.
3. For the cloud based UI, the file picker should only accept images that are in the right format.

```ts
import { createCollection } from "qino";

const { getOne: getPost } = createCollection({
  schema: z.object({
    title: z.string(),
    image: z.qino().asset(".jpg").local() // or .remote()
  }),
```

Second, image names in Decap were a huge pain. They had no pattern so names were all random, which made searching for images a pain. Qino should solve that pain point. Either in the schema or the configuration.

```ts
import { createCollection } from "qino";

const { getOne: getPost } = createCollection({
  schema: z.object({
    title: z.string(),
    image: z.qino().asset(".jpg").local().name("a-regexp-pattern")
  }),
```

OR

### Timestamps should be automatic

It's very common for some Markdown entries to have `published-at` and `updated-at` fields in their frontmatter, which is reflected in the Schema. There should be a way to pass custom zod fields to tell QINO these fields should be automatically tracked. For instance, once it gets published via the UI, it should automatically set `published-at` to the current date and time. Same principle for `updated-at`.

`published-at` and `updated-at` -> the full date and time
`published-on` and `updated-on` -> the date only

### Transoform data is a type-safe way

The common use case here is to create a blurb automatically based on frontmatter data. For instance, generate a blurb from from the content of a post.

```ts
import { createCollection } from "qino";

const { getOne: getPost } = createCollection({
  schema: z.object({
    title: z.string(),
  }),
  transform: async (post) => {
    return {
      blurb: stripMarkdown(post.content).slice(0, 100),
    };
  }
```
