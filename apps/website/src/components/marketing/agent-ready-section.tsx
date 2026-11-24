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
        Page Markdown comes from your content files, not scraped HTML. You
        decide what each MDX component becomes.
      </>
    ),
  },
  {
    title: "A Markdown URL for each page",
    description: (
      <>
        Each page you declare gets one, such as{" "}
        <InlineCode>/blog/hello-world.md</InlineCode>. An unknown slug gets a
        Markdown 404 that links to <InlineCode>llms.txt</InlineCode>.
      </>
    ),
  },
  {
    title: "An llms.txt that keeps up",
    description: (
      <>
        <InlineCode>qino build</InlineCode> writes{" "}
        <InlineCode>llms.txt</InlineCode> and{" "}
        <InlineCode>llms-full.txt</InlineCode> from your template and the pages
        you declare.
      </>
    ),
  },
];

export function AgentReadySection() {
  return (
    <Section aria-labelledby="agent-ready-heading" spacing="none" bleed>
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-7 md:pt-24 md:pb-14 lg:px-12">
        <SectionHeading
          id="agent-ready-heading"
          title="Same URL. HTML for people, Markdown for agents."
        >
          Hand your route's request to{" "}
          <InlineCode>negotiateMarkdown</InlineCode>, and the page's own URL
          answers in Markdown when the <InlineCode>Accept</InlineCode> header
          prefers it. Prerendered sites get the same through a host rewrite.
        </SectionHeading>
        <div className="mt-6">
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
        <div className="mt-9">
          <NegotiationSplit />
        </div>
      </div>
      {/* Cells carry the vertical padding on desktop so their dividers run full height. */}
      <div className="border-t">
        <div className="mx-auto grid max-w-7xl divide-y px-4 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-7 lg:px-12">
          {features.map(({ title, description }) => (
            <div
              key={title}
              className="min-w-0 py-7 md:px-6 md:py-8 md:first:pl-0 md:last:pr-0"
            >
              <Title as="h3" size="row">
                {title}
              </Title>
              <div className="mt-2">
                <Text>{description}</Text>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
