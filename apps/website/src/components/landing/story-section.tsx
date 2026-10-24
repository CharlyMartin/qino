import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import { mdxComponents } from "@/components/docs/mdx-components";
import { Brand } from "./brand";
import { Byline } from "./byline";
import { Section } from "./section";
import { Title } from "./title";

type Signature = {
  name: string;
  title: string;
  image: string;
  url: string;
};

type StorySectionProps = {
  title: string;
  signature: Signature;
  mdx: MDXRemoteSerializeResult<Record<string, never>, Record<string, never>>;
};

export function StorySection({ title, signature, mdx }: StorySectionProps) {
  return (
    <Section aria-labelledby="story-heading">
      <div className="mx-auto max-w-2xl">
        <Title id="story-heading">{title}</Title>
        <div className="prose prose-invert mt-8 max-w-none">
          <MDXRemote {...mdx} components={{ ...mdxComponents, Brand }} />
        </div>
        <div className="mt-8">
          <Byline
            name={signature.name}
            image={signature.image}
            url={signature.url}
          >
            {signature.title}
          </Byline>
        </div>
      </div>
    </Section>
  );
}
