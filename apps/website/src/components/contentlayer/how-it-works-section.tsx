import { CommandLine } from "@/components/landing/command-line";
import { InlineCode } from "@/components/landing/inline-code";
import { Section } from "@/components/landing/section";
import { SpecRow } from "@/components/landing/spec-row";
import { SpecTable } from "@/components/landing/spec-table";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";

const exitCheck =
  "npx skills add CharlyMartin/qino --skill contentlayer-exit-check";

export function HowItWorksSection() {
  return (
    <Section aria-labelledby="how-heading">
      <Title id="how-heading">Three steps, one week.</Title>
      <SpecTable>
        <SpecRow label="01" title="Send me the repo.">
          I read your Contentlayer config and content, and you get a fixed quote
          and a written plan within 48 hours.
        </SpecRow>
        <SpecRow label="02" title="I do the work.">
          Five working days in a branch of your repo. Zod schemas for every
          document type, relations between them, MDX components rewired,{" "}
          <InlineCode>qino build</InlineCode> in CI.
        </SpecRow>
        <SpecRow label="03" title="You review one PR.">
          It builds on Next.js 16. You merge when you're happy. I fix anything
          the migration touched for 14 days.
        </SpecRow>
      </SpecTable>
      <div className="mt-12 max-w-2xl">
        <Title as="h3" size="row">
          Not sure how big yours is?
        </Title>
        <div className="mt-2">
          <Text>
            Run the Contentlayer Exit Check. It's free, runs locally with your
            coding agent, and lists every document type, reference and MDX
            component the migration touches, plus any broken links you have
            today. Send me the report and the quote comes back within 48 hours.
          </Text>
        </div>
        <div className="mt-5 rounded-sm border">
          <CommandLine
            command={exitCheck}
            copyLabel="Copy skill install command"
          />
        </div>
      </div>
    </Section>
  );
}
