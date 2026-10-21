import { FileMdIcon } from "@phosphor-icons/react/ssr";

import { ExternalButtonLink } from "../landing/external-button-link";

type ViewMarkdownLinkProps = {
  slug: string;
};

// A plain link, not a router one: `/docs/<slug>.md` is a text file, not a route page.
export function ViewMarkdownLink({ slug }: ViewMarkdownLinkProps) {
  return (
    <ExternalButtonLink href={`/docs/${slug}.md`} variant="outline" size="sm">
      <FileMdIcon className="size-4" aria-hidden="true" />
      View Markdown
    </ExternalButtonLink>
  );
}
