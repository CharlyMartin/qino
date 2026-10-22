import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { createFileRoute } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { PostMeta } from "../components/blog/post-meta";
import { PostNotFound } from "../components/blog/post-not-found";
import { mdxComponents } from "../components/docs/mdx-components";
import { ButtonLink } from "../components/landing/button-link";
import { Text } from "../components/landing/text";
import { Title } from "../components/landing/title";
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

    const { title, description, publishedOn } = loaderData;
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
          author: { "@type": "Person", ...site.author },
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
        { name: "author", content: site.author.name },
        { property: "article:published_time", content: publishedOn },
      ],
    };
  },
  component: BlogPostPage,
  notFoundComponent: PostNotFound,
});

function BlogPostPage() {
  const { title, description, publishedOn, _stats, mdx } =
    Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-12 flex flex-col items-start gap-4 border-b pb-8">
        <PostMeta publishedOn={publishedOn} _stats={_stats} />
        <Title as="h1">{title}</Title>
        <Text size="lead">{description}</Text>
      </header>
      <div className="prose prose-invert max-w-none">
        <MDXRemote {...mdx} components={mdxComponents} />
      </div>
      <footer className="mt-12 border-t pt-8">
        <ButtonLink to="/blog" variant="outline" size="sm">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          All Posts
        </ButtonLink>
      </footer>
    </article>
  );
}
