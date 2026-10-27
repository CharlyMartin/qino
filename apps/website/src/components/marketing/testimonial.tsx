import { Byline } from "./byline";
import { Text } from "./text";

export type TestimonialProps = {
  name: string;
  title: string;
  company: string;
  quote: string;
  image: string;
  /** Where the quote was posted (Discord, X, ...). */
  url: string;
};

export function Testimonial({
  name,
  title,
  company,
  quote,
  image,
  url,
}: TestimonialProps) {
  return (
    <figure className="space-y-4 text-left">
      <blockquote className="font-medium italic">
        <Text>{quote}</Text>
      </blockquote>
      <figcaption>
        <Byline name={name} image={image} url={url}>
          {title}, {company}
        </Byline>
      </figcaption>
    </figure>
  );
}
