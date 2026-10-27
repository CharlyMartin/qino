import { InlineCode } from "@/components/landing/inline-code";
import { Section } from "@/components/landing/section";
import { Title } from "@/components/landing/title";
import { BulletList } from "./bullet-list";

export function FitSection() {
  return (
    <Section aria-labelledby="fit-heading">
      <h2 id="fit-heading" className="sr-only">
        Who it's for
      </h2>
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <Title as="h3">For you if</Title>
          <BulletList
            items={[
              <>
                Your Next.js marketing site, blog or docs imports{" "}
                <InlineCode>next-contentlayer</InlineCode> or{" "}
                <InlineCode>contentlayer2</InlineCode>
              </>,
              "You'd rather review a PR than spend a sprint on a content pipeline",
              "People who aren't developers need to edit that content",
            ]}
          />
        </div>
        <div>
          <Title as="h3">Not for you if</Title>
          <BulletList
            items={[
              "You've already moved to Content Collections or Velite and you're happy there",
              "You want a hosted CMS that owns your content in its own database",
              "Your content lives across ten client sites. Qino Cloud has a plan for that later.",
            ]}
          />
        </div>
      </div>
    </Section>
  );
}
