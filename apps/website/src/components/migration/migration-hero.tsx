import { DotSeparator } from "@/components/landing/dot-separator";
import { ExternalButtonLink } from "@/components/landing/external-button-link";
import { Eyebrow } from "@/components/landing/eyebrow";
import { InlineCode } from "@/components/landing/inline-code";
import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";

type MigrationHeroProps = {
  /** The visitor's repo, as `owner/name`. */
  repo?: string;
};

export function MigrationHero({ repo }: MigrationHeroProps) {
  return (
    <Section aria-labelledby="hero-heading" spacing="hero" align="center">
      <div className="flex flex-wrap items-center gap-2 md:justify-center">
        <Eyebrow tone="accent">Contentlayer migration</Eyebrow>
        <DotSeparator />
        <Eyebrow>Fixed price · 5 days</Eyebrow>
      </div>

      <div className="mt-8 mb-16 space-y-8">
        <div className="max-w-3xl md:mx-auto">
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
              "Get off Contentlayer and onto Next.js 16 in a week"
            )}
          </Title>
        </div>

        <div className="max-w-xl text-balance md:mx-auto">
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
          <div className="flex flex-col gap-3 md:flex-row md:justify-center">
            <ExternalButtonLink href="#start">Get unblocked</ExternalButtonLink>
            <ExternalButtonLink href="#pricing" variant="outline">
              See what's included
            </ExternalButtonLink>
          </div>
          <Text size="small">
            $1,499 fixed for the first 5 teams · half up front
          </Text>
        </div>
      </div>
    </Section>
  );
}
