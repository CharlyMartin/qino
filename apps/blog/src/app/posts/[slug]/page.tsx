import Image from "next/image";
import Link from "next/link";
import { getPost } from "../../../../qino/collections/posts";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await getPost(slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link
        href="/posts"
        className="mb-8 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← All posts
      </Link>
      <div className="relative mb-8 aspect-1200/630 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={post.image}
          alt=""
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
          priority
        />
      </div>
      <header className="mb-8 flex flex-col gap-3">
        <time className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {new Date(post["created-on"]).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
          {post.title}
        </h1>
      </header>
      <pre className="whitespace-pre-wrap font-sans text-base leading-7 text-zinc-800 dark:text-zinc-200">
        {post.markdown}
      </pre>
    </article>
  );
}
