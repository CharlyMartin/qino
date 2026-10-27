import { createFileRoute } from "@tanstack/react-router";

import { AboutSection } from "@/components/marketing/about-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { InlineCta } from "@/components/marketing/inline-cta";
import { MigrationHero } from "@/components/marketing/migration-hero";
import { PricingSection } from "@/components/marketing/pricing-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { ProcessSection } from "@/components/marketing/process-section";
import { ProofSection } from "@/components/marketing/proof-section";
import { ScopeSection } from "@/components/marketing/scope-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { SkipLink } from "@/components/marketing/skip-link";
import { StartSection } from "@/components/marketing/start-section";
import { getPageHead } from "@/lib/get-page-head";
import { parseMigrationSearch } from "@/lib/parse-migration-search";
import { site } from "@/lib/site";
import { getProjectStats } from "@/server/get-project-stats";
import { getTestimonials } from "@/server/get-testimonials";

const path = "/contentlayer-exit";
const description =
  "Stuck on Contentlayer and can't upgrade Next.js? I'll replace it with qino and upgrade you to Next.js 16 in one green pull request, in three days, for a fixed $999.";

export const Route = createFileRoute("/contentlayer-exit")({
  validateSearch: parseMigrationSearch,
  loader: async () => {
    const [testimonials, stats] = await Promise.all([
      getTestimonials(),
      getProjectStats(),
    ]);
    return { testimonials, stats };
  },
  head: () =>
    getPageHead({
      title: "Migrate from Contentlayer to Next.js 16 | qino",
      description,
      path,
      jsonLd: [
        {
          "@type": "Service",
          name: "Contentlayer to Next.js 16 migration",
          url: `${site.url}${path}`,
          description,
          provider: { "@type": "Person", ...site.author },
          offers: { "@type": "Offer", price: "999", priceCurrency: "USD" },
        },
      ],
    }),
  component: ContentlayerExitPage,
});

function ContentlayerExitPage() {
  const { testimonials, stats } = Route.useLoaderData();
  const { repo } = Route.useSearch();

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <MigrationHero repo={repo} />
        <ProblemSection />
        <InlineCta />
        <ScopeSection />
        <PricingSection />
        <ProcessSection />
        <AboutSection />
        <FaqSection />
        <ProofSection testimonials={testimonials} stats={stats} />
        <StartSection repo={repo} />
      </main>
      <SiteFooter />
    </>
  );
}
