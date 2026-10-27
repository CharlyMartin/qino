import { Section } from "@/components/marketing/section";
import { SectionHeading } from "@/components/marketing/section-heading";
import { SpecRow } from "@/components/marketing/spec-row";
import { SpecTable } from "@/components/marketing/spec-table";

export function ProblemSection() {
  return (
    <Section aria-labelledby="problem-heading">
      <SectionHeading
        id="problem-heading"
        title="Why you can't just bump the version"
      >
        Upgrading Next.js means replacing Contentlayer first. That's the part
        nobody on the team has a spare week for.
      </SectionHeading>
      <SpecTable>
        <SpecRow
          label="Abandoned"
          title="Contentlayer last shipped in June 2023"
        >
          Its community fork, contentlayer2, last shipped in May 2025. Nobody is
          coming to fix it for the next Next.js.
        </SpecRow>
        <SpecRow
          label="Unpatched"
          title="Next.js 15 lost support on 21 Oct 2026"
        >
          Security fixes now land in Next.js 16 only. Every week on an older
          version is a week without patches.
        </SpecRow>
        <SpecRow label="Coupled" title="Contentlayer is wired into your build">
          It hooks into Next.js through webpack, and Next.js 16 builds with
          Turbopack by default. The upgrade and the replacement are one job.
        </SpecRow>
        <SpecRow
          label="Common"
          title="96 of 124 company repos are in the same spot"
        >
          Of the organisation repos still on Contentlayer on GitHub, 96 run a
          Next.js version that no longer gets security patches.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
