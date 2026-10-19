import { Testimonial, type TestimonialProps } from "./testimonial";

type TestimonialsSectionProps = {
  testimonials: Array<TestimonialProps>;
};

export function TestimonialsSection({
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section aria-labelledby="testimonials-heading" className="border-b">
      <h2 id="testimonials-heading" className="sr-only">
        What developers say
      </h2>
      <div className="mx-auto grid max-w-5xl divide-y md:grid-cols-2 md:divide-x md:divide-y-0 md:border-x">
        {testimonials.map((testimonial) => (
          <div key={testimonial.name} className="min-w-0 px-4 py-8 md:p-10">
            <Testimonial {...testimonial} />
          </div>
        ))}
      </div>
    </section>
  );
}
