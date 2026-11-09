import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { createFileRoute } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { PostAuthor } from "../components/blog/post-author";
import { PostMeta } from "../components/blog/post-meta";
import { PostNotFound } from "../components/blog/post-not-found";
import { PostUpdatedOn } from "../components/blog/post-updated-on";
import { mdxComponents } from "../components/docs/mdx-components";
import { ButtonLink } from "../components/marketing/button-link";
import { Text } from "../components/marketing/text";
import { Title } from "../components/marketing/title";
import { getPageHead } from "../lib/get-page-head";
import { site } from "../lib/site";
import { getPost } from "../server/get-post";

const notFoundMeta = [
  { title: "Post not found | qino" },
  { name: "robots", content: "noindex" },
];

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getPost({ data: params.slug }),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: notFoundMeta };

    const { title, description, publishedOn, updatedOn, author } = loaderData;
    const path = `/blog/${params.slug}`;
    const head = getPageHead({
      title: `${title} | qino`,
      description,
      path,
      type: "article",
      jsonLd: [
        {
          "@type": "BlogPosting",
          headline: title,
          description,
          url: `${site.url}${path}`,
          image: `${site.url}${site.ogImage}`,
          datePublished: publishedOn,
          dateModified: updatedOn ?? publishedOn,
          author: {
            "@type": "Person",
            name: author.name,
            image: `${site.url}${author.image.src}`,
            jobTitle: author.role,
            worksFor: { "@type": "Organization", name: author.company },
          },
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
        },
      ],
    });

    return {
      ...head,
      meta: [
        ...head.meta,
        { name: "author", content: author.name },
        { property: "article:published_time", content: publishedOn },
        ...(updatedOn
          ? [{ property: "article:modified_time", content: updatedOn }]
          : []),
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: PostNotFound,
});

function BlogPostPage() {
  const { title, description, publishedOn, updatedOn, author, _stats, mdx } =
    Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-12 flex flex-col items-start gap-3 border-b pb-8">
        <PostMeta publishedOn={publishedOn} _stats={_stats} />
        <Title as="h1">{title}</Title>
        <Text size="lead">{description}</Text>
        <div className="pt-6">
          <PostAuthor {...author} />
        </div>
      </header>
      <div className="prose prose-invert max-w-none">
        <MDXRemote {...mdx} components={mdxComponents} />
      </div>
      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-8">
        <ButtonLink to="/blog" variant="outline" size="sm">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          All Posts
        </ButtonLink>
        {updatedOn && <PostUpdatedOn updatedOn={updatedOn} />}
      </footer>
    </article>
  );
}
