import { ExternalLink } from "@/components/landing/external-link";
import { Section } from "@/components/landing/section";
import { SectionHeading } from "@/components/landing/section-heading";
import { SpecRow } from "@/components/landing/spec-row";
import { SpecTable } from "@/components/landing/spec-table";
import { TextLink } from "@/components/landing/text-link";
import { externalLinks } from "@/lib/external-links";

export function ScopeSection() {
  return (
    <Section aria-labelledby="scope-heading">
      <SectionHeading
        id="scope-heading"
        title="One pull request. Your site, unblocked."
      >
        I do the work in your repo, on a branch. You review it and merge it like
        any other PR.
      </SectionHeading>
      <SpecTable>
        <SpecRow label="Replace" title="Contentlayer out, qino in">
          Your document types become Zod schemas, with the same fields and typed
          queries. Your Markdown and MDX stay in your repo.
        </SpecRow>
        <SpecRow label="Upgrade" title="Next.js 16">
          Next.js and React on current versions, including the changes the
          upgrade forces in your own code.
        </SpecRow>
        <SpecRow label="Verify" title="A green build, with checked links">
          Pages render as before, and broken references between documents now
          fail the build instead of shipping.
        </SpecRow>
        <SpecRow label="Deliver" title="Five working days">
          One site, one branch, CI green, with a preview deploy if your host
          makes one.
        </SpecRow>
        <SpecRow label="Own" title="No lock-in">
          <ExternalLink href={externalLinks.npm}>qino</ExternalLink> is open
          source, MIT-licensed, and runs inside your repo. No service to depend
          on, no account to create.
        </SpecRow>
        <SpecRow label="Bonus" title="Qino Cloud beta pricing, for life">
          The <TextLink to="/cloud">cloud UI</TextLink> lets non-developers edit
          content and open pull requests from the browser. When it launches, you
          keep beta pricing for as long as you use it.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
