import { negotiateMarkdown } from "@qino/cms";
import { createFileRoute } from "@tanstack/react-router";

import { postCollection } from "../../qino/posts";
import { PostCard } from "../components/blog/post-card";
import { Text } from "../components/marketing/text";
import { Title } from "../components/marketing/title";
import { getPageHead } from "../lib/get-page-head";
import { site } from "../lib/site";
import { getIndexMarkdownUrls } from "../server/get-index-markdown-urls";
import { getPosts } from "../server/get-posts";

const description =
  "Notes on building qino, a type-safe content pipeline for Markdown.";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const [posts, markdownUrls] = await Promise.all([
      getPosts(),
      getIndexMarkdownUrls(),
    ]);
    return { posts, markdownUrl: markdownUrls.blog };
  },
  head: ({ loaderData }) =>
    getPageHead({
      title: "Blog | qino",
      description,
      path: "/blog",
      markdownUrl: loaderData?.markdownUrl,
      jsonLd: [
        {
          "@type": "Blog",
          name: "qino blog",
          url: `${site.url}/blog`,
          description,
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
        },
      ],
    }),
  server: {
    handlers: {
      // The index page's Markdown, when `Accept` prefers it.
      GET: async ({ request, next }) =>
        (await negotiateMarkdown(request, () =>
          postCollection.getPageMarkdown(),
        )) ?? next(),
    },
  },
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const { posts } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-12 flex flex-col items-start gap-4">
        <Title as="h1">Blog</Title>
        <Text size="lead">{description}</Text>
      </header>
      <ul className="flex flex-col gap-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <PostCard {...post} />
          </li>
        ))}
      </ul>
    </div>
  );
}
