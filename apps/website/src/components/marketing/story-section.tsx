import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import { mdxComponents } from "@/components/docs/mdx-components";
import { Brand } from "./brand";
import { ButtonLink } from "./button-link";
import { Section } from "./section";
import { Title } from "./title";

type StorySectionProps = {
  title: string;
  mdx: MDXRemoteSerializeResult<Record<string, never>, Record<string, never>>;
};

export function StorySection({ title, mdx }: StorySectionProps) {
  return (
    <Section aria-labelledby="story-heading">
      <div className="mx-auto max-w-2xl">
        <Title id="story-heading">{title}</Title>
        <div className="prose prose-invert mt-8 max-w-none">
          <MDXRemote {...mdx} components={{ ...mdxComponents, Brand }} />
        </div>
        <div className="mt-8">
          <ButtonLink
            to="/blog/$slug"
            params={{ slug: "why-another-cms" }}
            variant="outline"
            size="sm"
          >
            Read the full story
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
