import Image from "next/image";
import Link from "next/link";

import { authorCollection } from "../../../qino/collections/authors";
import { categoryCollection } from "../../../qino/collections/categories";
import { postCollection } from "../../../qino/collections/posts";
import { TagFilters } from "./tag-filters";

type PostsIndexProps = {
  tag?: string;
  author?: string;
};

export async function PostsIndex({ tag, author }: PostsIndexProps) {
  const [posts, categories] = await Promise.all([
    postCollection.getEntries(),
    categoryCollection.getEntries(),
  ]);

  const tags = categories
    .map((category) => ({ slug: category._meta.slug, name: category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sorted = posts
    .filter((post) => !tag || post.category._meta.slug == tag)
    .filter((post) => !author || post.author._meta.slug == author)
    .sort((a, b) => b.createdOn.localeCompare(a.createdOn));

  const tagName = tags.find((t) => t.slug == tag)?.name;
  const authorEntry = author
    ? await authorCollection.getEntry(author)
    : undefined;

  const title = authorEntry
    ? `Posts by ${authorEntry.firstName} ${authorEntry.lastName}`
    : tagName
      ? `Posts about ${tagName}`
      : "Posts";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h1>
      <div className="mb-10">
        {author ? (
          <Link
            href="/posts"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            {"< All posts"}
          </Link>
        ) : (
          <TagFilters tags={tags} activeTag={tag} />
        )}
      </div>
      {sorted.length == 0 && (
        <p className="text-zinc-500 dark:text-zinc-400">No posts yet.</p>
      )}
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((post) => (
          <li key={post._meta.slug}>
            <Link
              href={`/posts/${post._meta.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  placeholder="blur"
                  sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  <time>
                    {new Date(post.createdOn).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span aria-hidden="true">·</span>
                  <span>{post.category.name}</span>
                </div>
                <h2 className="text-lg font-semibold leading-tight text-zinc-950 group-hover:underline dark:text-zinc-50">
                  {post.title}
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {post.author.firstName} {post.author.lastName}
                  {" - "}
                  {post.author.title} @ {post.author.company}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
