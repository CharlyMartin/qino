import { createFileRoute } from "@tanstack/react-router";

import { AgentSection } from "@/components/marketing/agent-section";
import { CliSection } from "@/components/marketing/cli-section";
import { FileTypes } from "@/components/marketing/file-types";
import { Hero } from "@/components/marketing/hero";
import { Pipeline } from "@/components/marketing/pipeline";
import { PrimitivesSection } from "@/components/marketing/primitives-section";
import { RelationsSection } from "@/components/marketing/relations-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SkipLink } from "@/components/marketing/skip-link";
import { StorySection } from "@/components/marketing/story-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { externalLinks } from "@/lib/external-links";
import { getPageHead } from "@/lib/get-page-head";
import { site } from "@/lib/site";
import { getProjectStats } from "@/server/get-project-stats";
import { getSection } from "@/server/get-section";
import { getSnippets } from "@/server/get-snippets";
import { getTestimonials } from "@/server/get-testimonials";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [snippets, testimonials, stats, story] = await Promise.all([
      getSnippets(),
      getTestimonials(),
      getProjectStats(),
      getSection({ data: "why-i-built-qino" }),
    ]);
    return { ...snippets, testimonials, stats, story };
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
    story,
  } = Route.useLoaderData();

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <Hero stats={stats} />
        <TestimonialsSection testimonials={testimonials} />
        <StorySection {...story} />
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
