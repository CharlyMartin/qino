import { DotSeparator } from "@/components/marketing/dot-separator";
import { ExternalButtonLink } from "@/components/marketing/external-button-link";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { InlineCode } from "@/components/marketing/inline-code";
import { Section } from "@/components/marketing/section";
import { Text } from "@/components/marketing/text";
import { Title } from "@/components/marketing/title";
import { PriceNote } from "./price-note";
import { TerminalSplit } from "./terminal-split";

type MigrationHeroProps = {
  /** The visitor's repo, as `owner/name`. */
  repo?: string;
};

export function MigrationHero({ repo }: MigrationHeroProps) {
  return (
    <Section aria-labelledby="hero-heading" spacing="hero">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow tone="accent">Contentlayer exit</Eyebrow>
        <DotSeparator />
        <Eyebrow>Fixed price</Eyebrow>
        <DotSeparator />
        <Eyebrow>3 days</Eyebrow>
      </div>

      <div className="mt-6 space-y-8">
        <div className="max-w-4xl">
          <Title as="h1" size="display" id="hero-heading">
            {repo ? (
              <>
                {/* Long repo names wrap anywhere instead of overflowing on phones. */}
                Get{" "}
                <span className="wrap-anywhere underline decoration-primary/50 decoration-2 underline-offset-[0.12em]">
                  {repo}
                </span>{" "}
                off Contentlayer
              </>
            ) : (
              "Get off Contentlayer and onto Next.js 16 this week"
            )}
          </Title>
        </div>

        <div className="max-w-xl text-balance">
          <Text size="lead">
            {repo ? (
              <>
                <InlineCode>{repo}</InlineCode> still runs on Contentlayer,
                which hasn't shipped since 2023, and it's keeping the site on a
                Next.js that no longer gets security patches.
              </>
            ) : (
              <>
                Contentlayer hasn't shipped since 2023, and it's keeping you on
                a Next.js that no longer gets security patches.
              </>
            )}{" "}
            I'll replace it and upgrade you to Next.js 16 in one green pull
            request, for a fixed price.
          </Text>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <ExternalButtonLink href="#start">Get unblocked</ExternalButtonLink>
            <ExternalButtonLink href="#pricing" variant="outline">
              See what's included
            </ExternalButtonLink>
          </div>
          <PriceNote />
        </div>

        <div className="max-w-4xl">
          <TerminalSplit />
        </div>
      </div>
    </Section>
  );
}
