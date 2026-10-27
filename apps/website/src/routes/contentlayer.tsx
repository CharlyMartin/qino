import { createFileRoute } from "@tanstack/react-router";

import { AboutSection } from "@/components/contentlayer/about-section";
import { ExitCta } from "@/components/contentlayer/exit-cta";
import { ExitHero } from "@/components/contentlayer/exit-hero";
import { FaqSection } from "@/components/contentlayer/faq-section";
import { FitSection } from "@/components/contentlayer/fit-section";
import { HowItWorksSection } from "@/components/contentlayer/how-it-works-section";
import { IncludedSection } from "@/components/contentlayer/included-section";
import { PriceSection } from "@/components/contentlayer/price-section";
import { ProblemSection } from "@/components/contentlayer/problem-section";
import { ProofSection } from "@/components/contentlayer/proof-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { SkipLink } from "@/components/landing/skip-link";
import { getPageHead } from "@/lib/get-page-head";
import { getTestimonials } from "@/server/get-testimonials";

const description =
  "Contentlayer is effectively unmaintained and blocks the Next.js 16 bump. A fixed-price, one-week migration to qino inside your own repo, handed back as a green pull request.";

// Linked from outreach messages only, so it stays out of the site nav.
export const Route = createFileRoute("/contentlayer")({
  loader: () => getTestimonials(),
  head: () =>
    getPageHead({
      title: "Move off Contentlayer in a week | qino",
      description,
      path: "/contentlayer",
    }),
  component: ContentlayerPage,
});

function ContentlayerPage() {
  const testimonials = Route.useLoaderData();

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content">
        <ExitHero />
        <ProblemSection />
        <HowItWorksSection />
        <IncludedSection />
        <ProofSection testimonials={testimonials} />
        <FitSection />
        <AboutSection />
        <PriceSection />
        <FaqSection />
        <ExitCta />
      </main>
      <SiteFooter />
    </>
  );
}
