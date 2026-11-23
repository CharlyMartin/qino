import { negotiateMarkdown } from "@qino/cms";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { docsTree } from "../../qino/docs";
import { CopyMarkdownButton } from "../components/docs/copy-markdown-button";
import { DocsNotFound } from "../components/docs/docs-not-found";
import { DocsPagination } from "../components/docs/docs-pagination";
import { DocsToc } from "../components/docs/docs-toc";
import { DocsTocSelect } from "../components/docs/docs-toc-select";
import { mdxComponents } from "../components/docs/mdx-components";
import { ViewMarkdownLink } from "../components/docs/view-markdown-link";
import { Eyebrow } from "../components/marketing/eyebrow";
import { Text } from "../components/marketing/text";
import { Title } from "../components/marketing/title";
import { useActiveHeading } from "../hooks/use-active-heading";
import { getPageHead } from "../lib/get-page-head";
import { hasDocsSlug } from "../lib/has-docs-slug";
import { site } from "../lib/site";
import { toEntrySlug } from "../lib/to-entry-slug";
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

    const { slug, title, description, breadcrumbs, markdownUrl } = loaderData;
    const path = `/docs/${slug}`;
    return getPageHead({
      title: `${title} | qino`,
      description,
      path,
      markdownUrl,
      type: "article",
      jsonLd: [
        {
          "@type": "TechArticle",
          headline: title,
          description,
          url: `${site.url}${path}`,
          image: `${site.url}${site.ogImage}`,
          author: { "@type": "Person", ...site.author },
          publisher: { "@id": site.organizationId },
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
  },
  server: {
    handlers: {
      // Page Markdown at `/docs/<slug>.md`, or when `Accept` prefers it.
      GET: async ({ request, params, next }) =>
        (await negotiateMarkdown(request, () =>
          docsTree.getPageMarkdown(toEntrySlug(params._splat ?? "")),
        )) ?? next(),
    },
  },
  component: DocsPage,
  notFoundComponent: DocsNotFound,
});

function DocsPage() {
  const {
    slug,
    title,
    description,
    since,
    pageMarkdown,
    toc,
    mdx,
    previousNode,
    nextNode,
  } = Route.useLoaderData();
  // Top-level pages are section landings with only a link grid to copy.
  const isSectionLanding = !slug.includes("/");
  const activeId = useActiveHeading(toc);
  const hasToc = toc.length > 0;

  return (
    <div className="flex gap-12">
      {/* Fills the space left of the TOC, the page centered in it. */}
      <div className="min-w-0 flex-1">
        <article className="mx-auto max-w-3xl">
          <header className="mb-12 flex flex-col items-start gap-4 border-b pb-8">
            {since ? <Eyebrow tone="accent">Since {since}</Eyebrow> : null}
            <Title as="h1">{title}</Title>
            <Text size="lead">{description}</Text>
            {isSectionLanding ? null : (
              <div className="flex flex-wrap gap-2">
                <CopyMarkdownButton markdown={pageMarkdown} />
                <ViewMarkdownLink slug={slug} />
              </div>
            )}
          </header>
          {hasToc ? (
            <div className="sticky top-14 z-20 -mt-4 mb-8 bg-background py-3 xl:hidden">
              <DocsTocSelect toc={toc} activeId={activeId} />
            </div>
          ) : null}
          <div className="prose prose-invert max-w-none">
            <MDXRemote {...mdx} components={mdxComponents} />
          </div>
          <DocsPagination previousNode={previousNode} nextNode={nextNode} />
        </article>
      </div>
      {/* On the right edge, and kept on pages without a TOC so every page
          lines up the same way. */}
      <div className="hidden xl:block xl:w-52 xl:shrink-0">
        {hasToc ? (
          // Sticks where it starts: below the 3.5rem header and main's 4rem padding.
          <aside className="sticky top-30 max-h-[calc(100dvh-9.5rem)] overflow-y-auto overscroll-contain">
            <DocsToc toc={toc} activeId={activeId} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
