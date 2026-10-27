import { createFileRoute } from "@tanstack/react-router";

import { DotSeparator } from "../components/marketing/dot-separator";
import { Eyebrow } from "../components/marketing/eyebrow";
import { NewsletterForm } from "../components/marketing/newsletter-form";
import { Section } from "../components/marketing/section";
import { SiteFooter } from "../components/marketing/site-footer";
import { SiteHeader } from "../components/marketing/site-header";
import { SkipLink } from "../components/marketing/skip-link";
import { TestimonialsSection } from "../components/marketing/testimonials-section";
import { Text } from "../components/marketing/text";
import { Title } from "../components/marketing/title";
import { getPageHead } from "../lib/get-page-head";
import { getTestimonials } from "../server/get-testimonials";

const description =
  "The Cloud UI lets editors draft, review and publish content to GitHub from the browser. Join the waitlist for early access and secure beta pricing for life.";

export const Route = createFileRoute("/cloud")({
  loader: () => getTestimonials(),
  head: () =>
    getPageHead({ title: "Cloud | qino", description, path: "/cloud" }),
  component: CloudPage,
});

function CloudPage() {
  const testimonials = Route.useLoaderData();

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex flex-1 flex-col">
        <Section
          aria-labelledby="cloud-heading"
          spacing="hero"
          align="center"
          grow
        >
          <div className="flex items-center gap-2 md:justify-center">
            <Eyebrow tone="accent">Coming soon</Eyebrow>
            <DotSeparator />
            <Eyebrow>End of 2026</Eyebrow>
          </div>
          <div className="mt-4 space-y-4">
            <div className="max-w-3xl md:mx-auto">
              <Title as="h1" size="display" id="cloud-heading">
                Let your team edit content without touching code
              </Title>
            </div>
            <div className="max-w-xl text-balance md:mx-auto">
              <Text size="lead">{description}</Text>
            </div>
            <div className="max-w-2xl md:mx-auto mt-16">
              <NewsletterForm />
            </div>
          </div>
        </Section>
        <TestimonialsSection testimonials={testimonials} />
      </main>
      <SiteFooter />
    </div>
  );
}
