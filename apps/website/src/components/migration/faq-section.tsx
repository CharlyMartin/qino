import { Faq, type FaqItem } from "@/components/landing/faq";
import { Section } from "@/components/landing/section";
import { SectionHeading } from "@/components/landing/section-heading";
import { TextLink } from "@/components/landing/text-link";

const faqs: Array<FaqItem> = [
  {
    question: "Why not do it ourselves with an AI agent?",
    answer:
      "You absolutely can, and on a small blog it may take a few hours. On a real site, the time goes into the Next.js upgrade, the edge cases in your content and reviewing the diff. That's the work I take off your plate.",
  },
  {
    question: "What is qino?",
    answer: (
      <>
        An open-source library that turns Markdown, MDX and JSON into typed,
        validated content. It's a modern replacement to Contentlayer with a
        simpler API, and it's maintained. You can{" "}
        <TextLink to="/docs">read the docs</TextLink> before deciding if it's
        for you.
      </>
    ),
  },
  {
    question: "What if it takes longer than three days?",
    answer:
      "The qino migration and the Next.js 16 upgrade are a fixed price, so overruns there are on me.",
  },
  {
    question: "Our repo is private. Is that a problem?",
    answer:
      "No. You add me as a collaborator while I work on it, and I'm happy to sign an NDA first if required.",
  },
  {
    question: "Do we have to use Qino Cloud?",
    answer: (
      <>
        No. qino works on its own, for free. When{" "}
        <TextLink to="/cloud">Cloud</TextLink> launches, it's there if your
        editors want it, at beta pricing for life.
      </>
    ),
  },
];

export function FaqSection() {
  return (
    <Section aria-labelledby="faq-heading">
      <div className="grid gap-9 lg:grid-cols-12 lg:gap-x-7">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-heading" title="Questions?">
            One of your questions is not answered here? Feel free to email me at{" "}
            <a
              href="mailto:charly@hey.com"
              className="text-foreground-3 underline underline-offset-4 transition-colors hover:text-foreground"
            >
              charly@hey.com
            </a>
            .
          </SectionHeading>
        </div>
        <div className="lg:col-span-8">
          <Faq items={faqs} />
        </div>
      </div>
    </Section>
  );
}
