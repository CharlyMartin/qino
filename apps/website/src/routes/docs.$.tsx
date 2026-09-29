import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { CopyMarkdownButton } from "../components/docs/copy-markdown-button";
import { DocsNotFound } from "../components/docs/docs-not-found";
import { DocsPagination } from "../components/docs/docs-pagination";
import { mdxComponents } from "../components/docs/mdx-components";
import { Eyebrow } from "../components/landing/eyebrow";
import { Text } from "../components/landing/text";
import { Title } from "../components/landing/title";
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
  const {
    title,
    description,
    since,
    markdown,
    mdx,
    children,
    previousNode,
    nextNode,
  } = Route.useLoaderData();

  return (
    <article>
      <header className="mb-12 flex flex-col items-start gap-4 border-b pb-8">
        {since ? <Eyebrow tone="accent">Since {since.version}</Eyebrow> : null}
        <Title as="h1">{title}</Title>
        <Text size="lead">{description}</Text>
        <CopyMarkdownButton markdown={markdown} />
      </header>
      <div className="prose prose-invert max-w-none">
        <MDXRemote {...mdx} components={mdxComponents} />
      </div>
      {children.length > 0 ? (
        <section className="mt-16" aria-labelledby="in-this-section">
          <Title as="h2" size="row" id="in-this-section">
            In this section
          </Title>
          <ul className="mt-4 space-y-2">
            {children.map((child) => (
              <li key={child.slug}>
                <Link
                  to="/docs/$"
                  params={{ _splat: child.slug }}
                  className="text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
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
