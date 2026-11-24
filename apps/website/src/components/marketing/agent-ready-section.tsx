import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

import { ButtonLink } from "./button-link";
import { InlineCode } from "./inline-code";
import { NegotiationSplit } from "./negotiation-split";
import { Section } from "./section";
import { SectionHeading } from "./section-heading";
import { Text } from "./text";
import { Title } from "./title";

const features = [
  {
    title: "Built from your source",
    description: (
      <>
        Page Markdown comes from your content files, not from scraped HTML: a
        frontmatter block with the title, canonical URL and any description,
        then the body. You decide what each MDX component turns into.
      </>
    ),
  },
  {
    title: "A Markdown URL for each page",
    description: (
      <>
        Each page you declare also has a Markdown URL, such as{" "}
        <InlineCode>/blog/hello-world.md</InlineCode>. Your route answers it
        through <InlineCode>negotiateMarkdown</InlineCode>, which turns an
        unknown slug into a Markdown 404 that points agents to{" "}
        <InlineCode>llms.txt</InlineCode>.
      </>
    ),
  },
  {
    title: "An llms.txt that keeps up",
    description: (
      <>
        <InlineCode>qino build</InlineCode> writes{" "}
        <InlineCode>llms.txt</InlineCode>,{" "}
        <InlineCode>llms-full.txt</InlineCode> and{" "}
        <InlineCode>index.md</InlineCode> from a template you write, adding
        links built from the pages you declare.
      </>
    ),
  },
];

export function AgentReadySection() {
  return (
    <Section aria-labelledby="agent-ready-heading">
      <SectionHeading
        id="agent-ready-heading"
        title="Same URL. HTML for people, Markdown for agents."
      >
        Hand your route's request to <InlineCode>negotiateMarkdown</InlineCode>,
        and the page's own URL answers in Markdown when the{" "}
        <InlineCode>Accept</InlineCode> header prefers it. Prerendered sites get
        the same through a host rewrite.
      </SectionHeading>
      <div className="mt-9">
        <NegotiationSplit />
      </div>
      <div className="mt-10 grid gap-8 border-t pt-7 md:grid-cols-3 md:gap-7">
        {features.map(({ title, description }) => (
          <div key={title}>
            <Title as="h3" size="row">
              {title}
            </Title>
            <div className="mt-2">
              <Text>{description}</Text>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <ButtonLink
          to="/docs/$"
          params={{ _splat: "guide/agent-ready-content" }}
          variant="ghost"
          size="inline"
        >
          Read more about agent-ready content
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </ButtonLink>
      </div>
    </Section>
  );
}
