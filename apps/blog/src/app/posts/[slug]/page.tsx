import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { postCollection } from "../../../../qino/collections/posts";

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await postCollection.getAll();
  return posts.map((post) => ({ slug: post._meta.slug }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await postCollection.getOne(slug);

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link
        href="/posts"
        className="mb-8 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        {"< All posts"}
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
      <header className="mb-8 flex flex-col gap-4">
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
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-950 dark:text-zinc-50">
            {post.author.firstName} {post.author.lastName}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {post.author.title} @ {post.author.company}
          </span>
        </div>
        {post.categories.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <li
                key={category._meta.slug}
                title={category.description}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </header>
      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap" }],
            rehypeHighlight,
          ]}
          components={{
            img: ({ src, alt }) => (
              <Image
                src={typeof src == "string" ? src : ""}
                alt={alt ?? ""}
                width={1200}
                height={630}
                className="h-auto w-full rounded-lg"
              />
            ),
          }}
        >
          {post.body}
        </ReactMarkdown>
      </div>
    </article>
  );
}
