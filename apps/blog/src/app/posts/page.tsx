import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "../../../qino/collections/posts";

export default async function PostsIndex() {
  const posts = await getAllPosts();
  const sorted = [...posts].sort((a, b) =>
    b["created-on"].localeCompare(a["created-on"]),
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="mb-10 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Posts
      </h1>
      <ul className="flex flex-col gap-8">
        {sorted.map((post) => (
          <li key={post._meta.slug}>
            <Link
              href={`/posts/${post._meta.slug}`}
              className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              <div className="relative aspect-1200/630 w-full bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 768px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 p-5">
                <time className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {new Date(post["created-on"]).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
                <h2 className="text-xl font-semibold leading-tight text-zinc-950 group-hover:underline dark:text-zinc-50">
                  {post.title}
                </h2>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
