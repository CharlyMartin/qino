import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { DocsNotFound } from "../components/docs/docs-not-found";
import { DocsPagination } from "../components/docs/docs-pagination";
import { mdxComponents } from "../components/docs/mdx-components";
import { hasDocsSlug } from "../lib/has-docs-slug";
import { getDocsPage } from "../server/get-docs-page";

export const Route = createFileRoute("/docs/$")({
  loader: async ({ params, parentMatchPromise }) => {
    const slug = params._splat ?? "";
    const { loaderData } = await parentMatchPromise;
    if (!loaderData || !hasDocsSlug(loaderData, slug)) throw notFound();

    return getDocsPage({ data: slug });
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | Qino` },
          { name: "description", content: loaderData.description },
        ]
      : [{ title: "Page not found | Qino" }],
  }),
  component: DocsPage,
  notFoundComponent: DocsNotFound,
});

function DocsPage() {
  const { title, description, since, mdx, children, previousNode, nextNode } =
    Route.useLoaderData();

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        {since ? (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            Since {since.version}
          </p>
        ) : null}
      </header>
      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <MDXRemote {...mdx} components={mdxComponents} />
      </div>
      {children.length > 0 ? (
        <section className="mt-10" aria-label="In this section">
          <h2 className="mb-3 text-lg font-semibold">In this section</h2>
          <ul className="space-y-2">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  to="/docs/$"
                  params={{ _splat: child.slug }}
                  className="underline underline-offset-4"
                >
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <DocsPagination previousNode={previousNode} nextNode={nextNode} />
    </article>
  );
}
