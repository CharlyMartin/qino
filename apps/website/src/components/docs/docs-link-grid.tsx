import type { DocsLink } from "../../types/docs-link";
import { DocsLinkCard } from "./docs-link-card";

type DocsLinkGridProps = {
  links: Array<DocsLink>;
};

export function DocsLinkGrid({ links }: DocsLinkGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {links.map((link) => (
        <li key={link.slug}>
          <DocsLinkCard
            slug={link.slug}
            title={link.title}
            description={link.description}
          />
        </li>
      ))}
    </ul>
  );
}
