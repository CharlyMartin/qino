import { CheckIcon } from "@phosphor-icons/react/ssr";

import { ExternalButtonLink } from "@/components/landing/external-button-link";
import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";

const terms = [
  "Contentlayer replaced with qino",
  "Upgrade to Next.js 16",
  "One green pull request in three working days",
  "Half on signing, half when the PR is approved",
  "qino Cloud beta pricing forever",
];

export function PricingSection() {
  return (
    <Section aria-labelledby="pricing-heading" id="pricing" align="center">
      <Title id="pricing-heading">One fixed price</Title>
      <div className="mt-10 max-w-md rounded-sm border border-border-strong bg-surface p-7 text-left md:mx-auto md:p-9">
        <p className="font-mono text-label text-primary uppercase">
          Contentlayer exit
        </p>
        <p className="mt-4 flex items-baseline gap-3">
          <span className="text-5xl font-extrabold tracking-tighter text-foreground">
            $799
          </span>
          <s className="text-xl font-bold text-muted-foreground">
            <span className="sr-only">was </span>$999
          </s>
        </p>
        <div className="mt-3">
          <Text size="small">
            For the first 5 teams only, in exchange for a case study: a write-up
            of your migration to qino with your logo.
          </Text>
        </div>
        <ul className="mt-7 space-y-3 border-t pt-7">
          {terms.map((term) => (
            <li key={term} className="flex gap-3 font-medium text-foreground-2">
              <CheckIcon
                weight="bold"
                className="mt-1 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              {term}
            </li>
          ))}
        </ul>
        <div className="mt-8 grid">
          <ExternalButtonLink href="#start">Get unblocked</ExternalButtonLink>
        </div>
      </div>
    </Section>
  );
}
