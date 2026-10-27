import { DotSeparator } from "@/components/landing/dot-separator";
import { Eyebrow } from "@/components/landing/eyebrow";
import { Section } from "@/components/landing/section";
import { SpecRow } from "@/components/landing/spec-row";
import { SpecTable } from "@/components/landing/spec-table";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { QuoteButton } from "./quote-button";
import { TerminalSplit } from "./terminal-split";

export function ExitHero() {
  return (
    <Section aria-labelledby="exit-heading" spacing="hero">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow tone="accent">Contentlayer → qino</Eyebrow>
        <DotSeparator />
        <Eyebrow>Fixed price</Eyebrow>
        <DotSeparator />
        <Eyebrow>One week</Eyebrow>
      </div>
      <div className="mt-4 max-w-4xl">
        <Title as="h1" size="display" id="exit-heading">
          Your Next.js 16 upgrade turned into a content migration. I'll do it in
          a week.
        </Title>
      </div>
      <div className="mt-6 max-w-2xl">
        <Text size="lead">
          Contentlayer is effectively unmaintained and blocks the bump. I move
          your content to qino inside your own repo, for a fixed price, and hand
          back a green pull request.
        </Text>
      </div>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <QuoteButton />
        <Text size="small">
          Founding price: €2,500 for the first two teams, in exchange for a
          public case study. Then €3,500.
        </Text>
      </div>
      <div className="mt-10 max-w-4xl">
        <TerminalSplit />
      </div>
      <SpecTable>
        <SpecRow label="Price" title="Fixed price, fixed week.">
          Half up front, half when the PR is green.
        </SpecRow>
        <SpecRow label="Stack" title="Your stack stays.">
          Same Next.js app, same CI, same hosting. Only the content layer
          changes.
        </SpecRow>
        <SpecRow label="Build" title="Broken links fail the build.">
          References between your content are typed and checked on every deploy.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
