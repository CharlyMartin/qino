import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { QuoteButton } from "./quote-button";

export function PriceSection() {
  return (
    <Section aria-labelledby="price-heading">
      <Title id="price-heading" size="heading-lg">
        €3,500. Fixed.
      </Title>
      <div className="mt-4 max-w-xl space-y-4">
        <Text>
          About the cost of one week of a senior contractor, at a price that
          doesn't move. You pay half to book the week and half when the pull
          request builds green.
        </Text>
        <Text>
          Founding price: €2,500 for the first two teams, in exchange for a
          public write-up with your logo.
        </Text>
        <Text>
          Not ready to commit? The Exit Plan is €490: your repo read, a written
          plan, a fixed quote and one content type migrated as a working PR. The
          €490 comes off the full price if you go ahead.
        </Text>
      </div>
      <div className="mt-8">
        <QuoteButton />
      </div>
    </Section>
  );
}
