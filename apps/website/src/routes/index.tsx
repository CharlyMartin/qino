import { createFileRoute } from "@tanstack/react-router";

import { AgentSection } from "@/components/landing/agent-section";
import { CliSection } from "@/components/landing/cli-section";
import { FileTypes } from "@/components/landing/file-types";
import { Hero } from "@/components/landing/hero";
import { Pipeline } from "@/components/landing/pipeline";
import { PrimitivesSection } from "@/components/landing/primitives-section";
import { RelationsSection } from "@/components/landing/relations-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SkipLink } from "@/components/landing/skip-link";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { externalLinks } from "@/lib/external-links";
import { getPageHead } from "@/lib/get-page-head";
import { site } from "@/lib/site";
import { getProjectStats } from "@/server/get-project-stats";
import { getSnippets } from "@/server/get-snippets";
import { getTestimonials } from "@/server/get-testimonials";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [snippets, testimonials, stats] = await Promise.all([
      getSnippets(),
      getTestimonials(),
      getProjectStats(),
    ]);
    return { ...snippets, testimonials, stats };
  },
  head: () =>
    getPageHead({
      title: "qino — Markdown in. TypeScript out.",
      description: site.description,
      path: "/",
      jsonLd: [
        {
          "@type": "SoftwareApplication",
          name: site.name,
          url: site.url,
          description: site.description,
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Node.js 22+",
          license: "https://opensource.org/licenses/MIT",
          downloadUrl: externalLinks.npm,
          sameAs: [externalLinks.github, externalLinks.npm],
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          author: { "@type": "Person", ...site.author },
        },
      ],
    }),
  component: HomePage,
});

function HomePage() {
  const {
    pipelineFiles,
    pipelineDefine,
    pipelineQuery,
    relationsPosts,
    testimonials,
    stats,
  } = Route.useLoaderData();

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <Hero stats={stats} />
        <TestimonialsSection testimonials={testimonials} />
        <Pipeline
          files={pipelineFiles}
          define={pipelineDefine}
          query={pipelineQuery}
        />
        <FileTypes />
        <PrimitivesSection />
        <RelationsSection snippet={relationsPosts} />
        <CliSection />
        <AgentSection />
      </main>
      <SiteFooter />
    </>
  );
}
