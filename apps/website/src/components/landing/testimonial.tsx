import { ExternalLink } from "./external-link";
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
      <figcaption className="flex items-center gap-3">
        <img
          src={image}
          alt={name}
          width={40}
          height={40}
          loading="lazy"
          className="size-10 shrink-0 rounded-full"
        />
        <div>
          <p className="text-sm font-medium">
            <ExternalLink href={url}>{name}</ExternalLink>
          </p>
          <Text size="small">
            {title}, {company}
          </Text>
        </div>
      </figcaption>
    </figure>
  );
}
