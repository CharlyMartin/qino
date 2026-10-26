import { ExternalButtonLink } from "@/components/landing/external-button-link";
import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";

export function InlineCta() {
  return (
    <Section aria-labelledby="inline-cta-heading" spacing="cta">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Title as="h2" size="row" id="inline-cta-heading">
            One green PR, in five working days
          </Title>
          <Text size="small">
            $1,499 fixed for the first 5 teams · half up front
          </Text>
        </div>
        <ExternalButtonLink href="#start">
          Get unblocked this week
        </ExternalButtonLink>
      </div>
    </Section>
  );
}
