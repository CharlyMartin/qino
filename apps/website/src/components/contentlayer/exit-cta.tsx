import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { QuoteButton } from "./quote-button";

export function ExitCta() {
  return (
    <Section aria-labelledby="exit-cta-heading" spacing="cta" align="center">
      <Title id="exit-cta-heading" size="heading-lg">
        Get Contentlayer out of the way of your next upgrade.
      </Title>
      <div className="mt-8">
        <QuoteButton />
      </div>
      <div className="mt-4">
        <Text size="small">
          Fixed price · one week · half when the PR is green
        </Text>
      </div>
    </Section>
  );
}
