import { createFileRoute } from "@tanstack/react-router";

import { PostCard } from "../components/blog/post-card";
import { Text } from "../components/landing/text";
import { Title } from "../components/landing/title";
import { getPosts } from "../server/get-posts";

const description = "Notes on building Qino, a flat-file Markdown CMS.";

export const Route = createFileRoute("/blog/")({
  loader: () => getPosts(),
  head: () => ({
    meta: [
      { title: "Blog | Qino" },
      { name: "description", content: description },
    ],
  }),
  component: BlogIndexPage,
});

function BlogIndexPage() {
  const posts = Route.useLoaderData();

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
