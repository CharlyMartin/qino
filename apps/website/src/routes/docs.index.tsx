import { createFileRoute } from "@tanstack/react-router";

import { DocsSection } from "../components/docs/docs-section";
import { DocsWhatsNew } from "../components/docs/docs-whats-new";
import { InstallBox } from "../components/marketing/install-box";
import { Text } from "../components/marketing/text";
import { Title } from "../components/marketing/title";
import { getPageHead } from "../lib/get-page-head";
import { site } from "../lib/site";
import { getDocsSections } from "../server/get-docs-sections";
import { getLatestReleases } from "../server/get-latest-releases";

const description =
  "Guides, concepts, and the full API of qino, the type-safe content pipeline for Markdown, MDX, and JSON.";

export const Route = createFileRoute("/docs/")({
  loader: async () => {
    const [sections, releases] = await Promise.all([
      getDocsSections(),
      getLatestReleases(),
    ]);
    return { sections, releases };
  },
  head: () =>
    getPageHead({
      title: "Documentation | qino",
      description,
      path: "/docs",
      jsonLd: [
        {
          "@type": "WebPage",
          name: "qino documentation",
          url: `${site.url}/docs`,
          description,
          publisher: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
        },
      ],
    }),
  component: DocsIndexPage,
});

function DocsIndexPage() {
  const { sections, releases } = Route.useLoaderData();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16">
      <header className="flex flex-col items-start gap-4 border-b pb-12">
        <Title as="h1">Documentation</Title>
        <Text size="lead">{description}</Text>
        <div className="w-full max-w-2xl pt-4">
          <InstallBox command={["install", "skill"]} />
        </div>
      </header>
      <DocsWhatsNew releases={releases} />
      {sections.map((section) => (
        <DocsSection key={section.slug} {...section} />
      ))}
    </div>
  );
}
