import { Section } from "./section";
import { Testimonial, type TestimonialProps } from "./testimonial";

type TestimonialsSectionProps = {
  testimonials: Array<TestimonialProps>;
};

export function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <Section aria-labelledby="testimonials-heading" spacing="none" bleed>
      <h2 id="testimonials-heading" className="sr-only">
        What developers say
      </h2>
      {/* Each card keeps its half-of-5xl width; the row fits its cards and caps at 5xl, so 1 is centered and 3+ shrink to share. */}
      <div className="mx-auto flex max-w-5xl flex-col divide-y md:w-fit md:flex-row md:divide-x md:divide-y-0 md:border-x">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.name}
            className="min-w-0 px-4 py-8 md:w-lg md:p-10"
          >
            <Testimonial {...testimonial} />
          </div>
        ))}
      </div>
    </Section>
  );
}
