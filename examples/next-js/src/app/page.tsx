import Image from "next/image";
import Link from "next/link";

import { homeItem } from "../../qino/items/home";

export default async function Home() {
  const home = await homeItem.getData();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {home.title}
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {home.tagline}
        </p>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Featured posts
        </h2>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {home["featured-posts"].map((post) => (
            <li key={post._meta.slug}>
              <Link
                href={`/posts/${post._meta.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <div className="relative aspect-1200/630 w-full bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <time className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {new Date(post["created-on"]).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </time>
                  <h3 className="text-lg font-semibold leading-tight text-zinc-950 group-hover:underline dark:text-zinc-50">
                    {post.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {post.author.firstName} {post.author.lastName}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-6">
        <Link
          href="/posts"
          className="text-base font-medium text-zinc-950 underline underline-offset-4 hover:no-underline dark:text-zinc-50"
        >
          {"Read all posts >"}
        </Link>
        <Link
          href="/docs"
          className="text-base font-medium text-zinc-950 underline underline-offset-4 hover:no-underline dark:text-zinc-50"
        >
          {"Read the docs >"}
        </Link>
      </div>
    </main>
  );
}
