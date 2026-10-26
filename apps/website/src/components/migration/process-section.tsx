import { Section } from "@/components/landing/section";
import { SectionHeading } from "@/components/landing/section-heading";
import { SpecRow } from "@/components/landing/spec-row";
import { SpecTable } from "@/components/landing/spec-table";

export function ProcessSection() {
  return (
    <Section aria-labelledby="process-heading">
      <SectionHeading id="process-heading" title="How it works">
        Four steps, and only one of them needs your time.
      </SectionHeading>
      <SpecTable>
        <SpecRow label="Step 1" title="Send me your repo">
          I look at it and reply with a fixed scope, flagging anything that
          falls outside it before you commit.
        </SpecRow>
        <SpecRow label="Step 2" title="Sign and pay half">
          A short agreement and a 50% deposit, then I book your five days.
        </SpecRow>
        <SpecRow label="Step 3" title="Review the pull request">
          I work on a branch and share progress as I go. You get one green PR at
          the end.
        </SpecRow>
        <SpecRow label="Step 4" title="Pay the rest, merge when you want">
          The second half is due once the PR is green or approved by your team.
          Merging is up to you. Then we write the case study together.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
