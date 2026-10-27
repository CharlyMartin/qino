import { InlineCode } from "@/components/landing/inline-code";
import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { BulletList } from "./bullet-list";

export function IncludedSection() {
  return (
    <Section aria-labelledby="included-heading">
      <Title id="included-heading">What the week covers.</Title>
      <BulletList
        items={[
          <>
            One site, one repo, Contentlayer or contentlayer2 →{" "}
            <InlineCode>@qino/cms</InlineCode>
          </>,
          "Up to 6 document types and about 1,000 content files",
          "Zod schemas for every type, with relations wherever you used references or slugs",
          "Your existing MDX components, rewired rather than rewritten",
          <>
            <InlineCode>qino build</InlineCode> gating your CI
          </>,
          "Content routes building on Next.js 16",
          "A written handover, a one-hour walkthrough and 14 days of fixes",
          "A founding Qino Cloud seat for your editors: the first 3 months free from launch, then $39 per project per month, locked for life. Cancel anytime.",
        ]}
      />
      <div className="mt-6 max-w-xl">
        <Text size="small">
          Not included, quoted separately: Next.js 16 changes outside your
          content routes, redesigns and new content types.
        </Text>
      </div>
    </Section>
  );
}
