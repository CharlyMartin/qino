import { ExternalLink } from "@/components/marketing/external-link";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { Section } from "@/components/marketing/section";
import {
  Testimonial,
  type TestimonialProps,
} from "@/components/marketing/testimonial";
import { Title } from "@/components/marketing/title";
import { useProjectStats } from "@/hooks/use-project-stats";
import { externalLinks } from "@/lib/external-links";
import { formatCount } from "@/lib/format-count";
import type { ProjectStats } from "@/types/project-stats";
import { BulletList } from "./bullet-list";

type ProofSectionProps = {
  testimonials: Array<TestimonialProps>;
  stats: ProjectStats;
};

export function ProofSection({ testimonials, stats }: ProofSectionProps) {
  const { downloads } = useProjectStats(stats);

  return (
    <Section aria-labelledby="proof-heading">
      <Title id="proof-heading">qino already runs content in production.</Title>
      <BulletList
        items={[
          <>
            qino is{" "}
            <ExternalLink href={externalLinks.github}>open source</ExternalLink>{" "}
            (MIT).
          </>,
          downloads != null && (
            <>
              Downloaded{" "}
              <span className="tabular-nums">{formatCount(downloads)}</span>{" "}
              times on <ExternalLink href={externalLinks.npm}>npm</ExternalLink>{" "}
              in the last 30 days.
            </>
          ),
          <>
            It runs the content on several websites with non-developer editors,
            including the{" "}
            <ExternalLink href="https://fil.org/">
              Filecoin Foundation
            </ExternalLink>{" "}
            website, open source{" "}
            <ExternalLink href="https://github.com/FilecoinFoundationWeb/filecoin-foundation">
              on GitHub
            </ExternalLink>
            .
          </>,
        ].filter(Boolean)}
      />

      {testimonials.length > 0 && (
        <div className="mt-12 max-w-xl">
          <Eyebrow tone="accent">Loved by engineers</Eyebrow>
          <div className="mt-3 space-y-8">
            {testimonials.map((testimonial) => (
              <Testimonial key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
