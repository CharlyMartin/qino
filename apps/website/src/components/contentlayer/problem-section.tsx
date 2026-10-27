import { Section } from "@/components/landing/section";
import { SectionHeading } from "@/components/landing/section-heading";
import { Text } from "@/components/landing/text";

export function ProblemSection() {
  return (
    <Section aria-labelledby="problem-heading">
      <SectionHeading
        id="problem-heading"
        title="You were going to bump a version. Now you're replacing a pipeline."
      >
        next-contentlayer@0.3.4 shipped in June 2023 and still declares Next 12
        or 13. The fork, contentlayer2, last shipped in May 2025. Next.js 15
        lost support on 21 October 2026.
      </SectionHeading>
      <div className="mt-4 max-w-xl space-y-4">
        <Text>
          So the upgrade sits in the backlog, and the install needs overrides to
          pass. As one engineer put it: “It kinda works with Next 14 if you put
          some overrides in your package.json, but obviously long term it could
          become a problem…”
        </Text>
        <Text>Meanwhile, marketing still pings you to change a headline.</Text>
      </div>
    </Section>
  );
}
