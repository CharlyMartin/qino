import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { docsTree } from "../../../../qino/trees/docs";
import { DocsSidebar } from "../docs-sidebar";
import { mdxComponents } from "../mdx-components";

type DocsPageProps = {
  params: Promise<{ slug: Array<string> }>;
};

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug } = await params;
  const fullSlug = slug.join("/");

  const [nodes, entry, previousNode, nextNode] = await Promise.all([
    docsTree.getTree(),
    docsTree.getEntry(fullSlug),
    docsTree.getPreviousNode(fullSlug),
    docsTree.getNextNode(fullSlug),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl gap-12 px-6 py-16">
      <aside className="w-60 shrink-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Docs
        </h2>
        <DocsSidebar nodes={nodes} activeSlug={fullSlug} />
      </aside>
      <article className="flex-1">
        <Link
          href="/docs"
          className="mb-8 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          {"< Docs"}
        </Link>
        <header className="mb-8">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-50">
            {entry.title}
          </h1>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            slug: <code>{entry._meta.slug}</code>
          </p>
        </header>
        <div className="prose prose-zinc max-w-none dark:prose-invert">
          <MDXRemote
            source={entry.body}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [
                  rehypeSlug,
                  [rehypeAutolinkHeadings, { behavior: "wrap" }],
                  rehypeHighlight,
                ],
              },
            }}
          />
        </div>
        <nav className="mt-16 grid grid-cols-2 gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          {previousNode ? (
            <Link
              href={`/docs/${previousNode.slug}`}
              className="group flex flex-col items-start rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Previous
              </span>
              <span className="mt-1 text-sm font-medium text-zinc-950 group-hover:underline dark:text-zinc-50">
                {previousNode.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextNode ? (
            <Link
              href={`/docs/${nextNode.slug}`}
              className="group flex flex-col items-end rounded-lg border border-zinc-200 p-4 text-right transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Next
              </span>
              <span className="mt-1 text-sm font-medium text-zinc-950 group-hover:underline dark:text-zinc-50">
                {nextNode.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>
    </main>
  );
}
