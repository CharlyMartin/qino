import { ExternalLink } from "@/components/landing/external-link";
import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { site } from "@/lib/site";

export function AboutSection() {
  return (
    <Section aria-labelledby="about-heading">
      <Title id="about-heading">Why I do this.</Title>
      <div className="mt-4 max-w-xl space-y-4">
        <Text>
          At my last company we ran several websites on Markdown and tried two
          CMS tools on them, Decap and TinaCMS. We picked them because they plug
          into your existing site instead of forcing you into their framework.
          Both ended the same way: more time on the CMS than on the content.
        </Text>
        <Text>
          So I built qino. It runs the content on several sites today. This week
          is the same setup I've done on those sites, done on yours.
        </Text>
        <Text size="small">
          Charly, founder of qino ·{" "}
          <ExternalLink href={site.author.url}>
            GitHub: CharlyMartin
          </ExternalLink>
        </Text>
      </div>
    </Section>
  );
}
