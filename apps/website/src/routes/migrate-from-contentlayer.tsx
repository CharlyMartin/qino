import { createFileRoute } from "@tanstack/react-router";

import { ProofSection } from "@/components/contentlayer/proof-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SkipLink } from "@/components/landing/skip-link";
import { AboutSection } from "@/components/migration/about-section";
import { FaqSection } from "@/components/migration/faq-section";
import { InlineCta } from "@/components/migration/inline-cta";
import { MigrationHero } from "@/components/migration/migration-hero";
import { PricingSection } from "@/components/migration/pricing-section";
import { ProblemSection } from "@/components/migration/problem-section";
import { ProcessSection } from "@/components/migration/process-section";
import { ScopeSection } from "@/components/migration/scope-section";
import { StartSection } from "@/components/migration/start-section";
import { getPageHead } from "@/lib/get-page-head";
import { parseMigrationSearch } from "@/lib/parse-migration-search";
import { site } from "@/lib/site";
import { getTestimonials } from "@/server/get-testimonials";

const path = "/migrate-from-contentlayer";
const description =
  "Stuck on Contentlayer and can't upgrade Next.js? I'll replace it with qino and upgrade you to Next.js 16 in one green pull request, in three days, for a fixed $999.";

export const Route = createFileRoute("/migrate-from-contentlayer")({
  validateSearch: parseMigrationSearch,
  loader: () => getTestimonials(),
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
  component: MigrateFromContentlayerPage,
});

function MigrateFromContentlayerPage() {
  const testimonials = Route.useLoaderData();
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
        <ProofSection testimonials={testimonials} />
        <StartSection repo={repo} />
      </main>
      <SiteFooter />
    </>
  );
}
