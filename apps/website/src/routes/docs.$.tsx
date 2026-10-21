import { createFileRoute, notFound } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { CopyMarkdownButton } from "../components/docs/copy-markdown-button";
import { DocsNotFound } from "../components/docs/docs-not-found";
import { DocsPagination } from "../components/docs/docs-pagination";
import { mdxComponents } from "../components/docs/mdx-components";
import { ViewMarkdownLink } from "../components/docs/view-markdown-link";
import { Eyebrow } from "../components/landing/eyebrow";
import { Text } from "../components/landing/text";
import { Title } from "../components/landing/title";
import { getPageHead } from "../lib/get-page-head";
import { hasDocsSlug } from "../lib/has-docs-slug";
import { site } from "../lib/site";
import { getDocsMarkdown } from "../server/get-docs-markdown";
import { getDocsPage } from "../server/get-docs-page";

const notFoundMeta = [
  { title: "Page not found | qino" },
  { name: "robots", content: "noindex" },
];

export const Route = createFileRoute("/docs/$")({
  loader: async ({ params, parentMatchPromise }) => {
    const slug = params._splat ?? "";
    const { loaderData } = await parentMatchPromise;
    if (!loaderData || !hasDocsSlug(loaderData, slug)) throw notFound();

    return getDocsPage({ data: slug });
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: notFoundMeta };

    const { slug, title, description, breadcrumbs } = loaderData;
    const path = `/docs/${slug}`;
    const head = getPageHead({
      title: `${title} | qino`,
      description,
      path,
      type: "article",
      jsonLd: [
        {
          "@type": "TechArticle",
          headline: title,
          description,
          url: `${site.url}${path}`,
          image: `${site.url}${site.ogImage}`,
          author: { "@type": "Person", ...site.author },
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.title,
            item: `${site.url}/docs/${crumb.slug}`,
          })),
        },
      ],
    });

    return {
      ...head,
      links: [
        ...head.links,
        { rel: "alternate", type: "text/markdown", href: `${path}.md` },
      ],
    };
  },
  server: {
    handlers: {
      // `/docs/<slug>.md` serves the page as plain Markdown for LLMs and agents.
      GET: async ({ params, next }) => {
        // The prerender crawler requests paths with a trailing slash.
        const slug = (params._splat ?? "").replace(/\/$/, "");
        if (!slug.endsWith(".md")) return next();

        const markdown = await getDocsMarkdown(slug.slice(0, -".md".length));
        if (markdown == null) return new Response("Not found", { status: 404 });

        return new Response(markdown, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, s-maxage=86400",
          },
        });
      },
    },
  },
  component: DocsPage,
  notFoundComponent: DocsNotFound,
});

function DocsPage() {
  const { slug, title, description, since, raw, mdx, previousNode, nextNode } =
    Route.useLoaderData();
  // Top-level pages are section landings with only a link grid to copy.
  const isSectionLanding = !slug.includes("/");

  return (
    <article>
      <header className="mb-12 flex flex-col items-start gap-4 border-b pb-8">
        {since ? <Eyebrow tone="accent">Since {since.version}</Eyebrow> : null}
        <Title as="h1">{title}</Title>
        <Text size="lead">{description}</Text>
        {isSectionLanding ? null : (
          <div className="flex flex-wrap gap-2">
            <CopyMarkdownButton markdown={raw} />
            <ViewMarkdownLink slug={slug} />
          </div>
        )}
      </header>
      <div className="prose prose-invert max-w-none">
        <MDXRemote {...mdx} components={mdxComponents} />
      </div>
      <DocsPagination previousNode={previousNode} nextNode={nextNode} />
    </article>
  );
}
