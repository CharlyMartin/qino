# SPECS for qino

Qino is a flat-file Markdown CMS that aims at providing a great experience for both developers and content editors. It has two components: an npm package for people comfortable with IDEs (developers) and a cloud-based UI for people who prefer to work in the browser (content editors).

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
    author: z.string(), // The idea here is that this marks a relationship. If fetchRelationships is true, it will be automatically be present in the final object.
    // Could we generate zod schemas dynamically depending on the file structure? Let's say LinkToAuthor or RelattionshipToAuthor or AuthorSlug.
  }),

  // How to add a blurb automatically based on frontmatter data?
  cms: {
    parent: "src/pages/blog.md",
    fetchRelationships: true,
    transform: () => {} // A function or an array of functions. They will run after the qino functions.
  },
});
```

```ts
import { createPage } from "@/qino";

export const getHomePage = createPage({
  file: "src/content/page/home.md",
  schema z.object({}),

  cms: {
    indexFor: "src/content/blog",
    includeMeta: true,
    transform: () => {} // A function or an array of functions. They will run after the qino functions.
  }
});

export const {getOne, getAll} = createPages()
```

## Usage

```tsx
import { getPosts } from "@/qino";

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

The CLI has the following command:

`npx qino build` which updates `qino-lock.json` with the schema from all the collections and the pages based on the current state of the project. And `npx qino watch` which does the same but with a hot-reloading mechanism so that changes are instantly taken into account.

If it's a TS project, the CLI command would also add an generated `index.d.ts` file (name TBD) with a few useful types:

```ts
type BlogSlug = "a-blog-title" | "another-blog-title" | {}
type EventSlug = "an-event" | "another-event" | {}
type AllSlugs = BlogSlug | EventSlug | // ...

type GetOneBlogParams<Slug extends BlogSlug = string>
```

The `qino-lock.json` would be published on GitHub with the project. Then, the cloud-based UI for qino would read that file from GitHub to know create the dashboard.

## TODO and things to solve

### Make managing relationships between collections easy

**HERE**
**HERE**
**HERE**
**HERE**

A big pain point for using Markdown file as a CMS is managing relationships between collections. QINO should solve that pain point. For instance

```ts
import { createCollection } from "qino";

createCollection({
  schema: z.object({}),
  resolveDescendants: 1 | 2 | 3 | true, // true means all descendants. A number means the number of levels to resolve.
  resolveAncestors: 1 | 2 | 3 | true, // true means all ancestors. A number means the number of levels to resolve.
});
```

`resolveDescendants` and `resolveAncestors` can be defined at the `createCollection` level or called in the getter functions, which getter functions having precedence over the `createCollection` level.

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

### timestamps should be automatic

It's very common for some Markdown entries to have `published-at` and `updated-at` fields in their frontmatter, which is reflected in the Schema. There should be a way to pass custom zod fields to tell QINO these fields should be automatically tracked. For instance, once it gets published via the UI, it should automatically set `published-at` to the current date and time. Same principle for `updated-at`.

`published-at` and `updated-at` -> the full date and time
`published-on` and `updated-on` -> the date only

## Benefits of flat-file Markdown CMS

1. Markdown files are portable, durable, and easy to move between tools without vendor lock-in.
2. Local files support offline work, plain-text version control, and strong data ownership/privacy because your content stays under your control rather than inside a SaaS database.

## User stories

A Markdown CMS becomes attractive to cloud-CMS users when it stops feeling like “files in Git” and starts feeling like a safe, collaborative publishing product.

Keeping Markdown as the storage layer while abstracting Git, frontmatter, build pipelines, and parser quirks behind a strong editorial interface.

1. Editorial workflows are a common gap: scheduling, approvals, permissions, and staging are usually missing or require extra tooling.
2. Localization and media handling can become painful when you have many files, translations, image variants, and preview requirements.
