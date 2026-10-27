import { ExternalLink } from "@/components/landing/external-link";
import { Section } from "@/components/landing/section";
import {
  Testimonial,
  type TestimonialProps,
} from "@/components/landing/testimonial";
import { Title } from "@/components/landing/title";
import { BulletList } from "./bullet-list";

type ProofSectionProps = {
  testimonials: Array<TestimonialProps>;
};

export function ProofSection({ testimonials }: ProofSectionProps) {
  return (
    <Section aria-labelledby="proof-heading">
      <Title id="proof-heading">qino already runs content in production.</Title>
      <BulletList
        items={[
          "qino is open source (MIT). Read the code before you pay for anything.",
          <>
            It runs the content on several websites with non-developer editors,
            including the Filecoin Foundation website (
            <ExternalLink href="https://github.com/FilecoinFoundationWeb/filecoin-foundation">
              open source on GitHub
            </ExternalLink>
            ).
          </>,
        ]}
      />
      {testimonials.length > 0 && (
        <div className="mt-10 max-w-xl space-y-8">
          {testimonials.map((testimonial) => (
            <Testimonial key={testimonial.name} {...testimonial} />
          ))}
        </div>
      )}
    </Section>
  );
}
