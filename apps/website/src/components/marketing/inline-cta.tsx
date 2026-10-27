import { ExternalButtonLink } from "@/components/marketing/external-button-link";
import { Section } from "@/components/marketing/section";
import { Title } from "@/components/marketing/title";
import { PriceNote } from "./price-note";

export function InlineCta() {
  return (
    <Section aria-labelledby="inline-cta-heading" spacing="cta">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Title as="h2" size="row" id="inline-cta-heading">
            Get off contentlayer in 3 working days
          </Title>
          <PriceNote />
        </div>
        <ExternalButtonLink href="#start">
          Get unblocked this week
        </ExternalButtonLink>
      </div>
    </Section>
  );
}
