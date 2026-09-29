import { Link } from "@tanstack/react-router";

import { Text } from "../landing/text";
import { Title } from "../landing/title";

export function DocsNotFound() {
  return (
    <section className="flex flex-col items-start gap-4">
      <Title as="h1">Page not found</Title>
      <Text size="lead">This documentation page does not exist.</Text>
      <Link
        to="/docs"
        className="mt-2 text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Back to documentation
      </Link>
    </section>
  );
}
