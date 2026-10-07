import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { createFileRoute } from "@tanstack/react-router";
import { MDXRemote } from "next-mdx-remote";

import { PostMeta } from "../components/blog/post-meta";
import { PostNotFound } from "../components/blog/post-not-found";
import { mdxComponents } from "../components/docs/mdx-components";
import { ButtonLink } from "../components/landing/button-link";
import { Text } from "../components/landing/text";
import { Title } from "../components/landing/title";
import { getPost } from "../server/get-post";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => getPost({ data: params.slug }),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | Qino` },
          { name: "description", content: loaderData.description },
        ]
      : [{ title: "Post not found | Qino" }],
  }),
  component: BlogPostPage,
  notFoundComponent: PostNotFound,
});

function BlogPostPage() {
  const { title, description, publishedOn, wordCount, mdx } =
    Route.useLoaderData();

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-12 flex flex-col items-start gap-4 border-b pb-8">
        <PostMeta publishedOn={publishedOn} wordCount={wordCount} />
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
