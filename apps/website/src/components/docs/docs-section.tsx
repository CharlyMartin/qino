import { Link } from "@tanstack/react-router";

import type { DocsLink } from "../../types/docs-link";
import { Text } from "../marketing/text";
import { Title } from "../marketing/title";
import { DocsLinkGrid } from "./docs-link-grid";

type DocsSectionProps = {
  slug: string;
  title: string;
  description: string;
  links: Array<DocsLink>;
};

/** A docs section on the docs landing page, with a card per page in it. */
export function DocsSection({
  slug,
  title,
  description,
  links,
}: DocsSectionProps) {
  return (
    <section aria-labelledby={slug} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Title as="h2" size="row" id={slug}>
          <Link
            to="/docs/$"
            params={{ _splat: slug }}
            className="transition-colors hover:text-foreground-3"
          >
            {title}
          </Link>
        </Title>
        <Text>{description}</Text>
      </div>
      <DocsLinkGrid links={links} />
    </section>
  );
}
