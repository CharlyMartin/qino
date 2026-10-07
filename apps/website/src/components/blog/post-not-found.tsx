import { Link } from "@tanstack/react-router";

import { Text } from "../landing/text";
import { Title } from "../landing/title";

export function PostNotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-4">
      <Title as="h1">Post not found</Title>
      <Text size="lead">This blog post does not exist.</Text>
      <Link
        to="/blog"
        className="mt-2 text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Back to the blog
      </Link>
    </section>
  );
}
