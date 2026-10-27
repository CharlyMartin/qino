import { Byline } from "@/components/marketing/byline";
import { ExternalLink } from "@/components/marketing/external-link";
import { Section } from "@/components/marketing/section";
import { Text } from "@/components/marketing/text";
import { Title } from "@/components/marketing/title";
import { site } from "@/lib/site";

export function AboutSection() {
  return (
    <Section aria-labelledby="about-heading">
      <div className="mx-auto max-w-2xl space-y-6">
        <Title id="about-heading">Who does the work</Title>
        <Text>
          Me. I'm a senior software engineer and the maintainer of qino, the
          open-source library that replaces Contentlayer in your repo. It runs
          in production on the{" "}
          <ExternalLink href="https://fil.org">
            Filecoin Foundation
          </ExternalLink>{" "}
          website already. No agency, no handoff: the person who wrote the
          library writes your PR.
        </Text>
        <Byline
          name={site.author.name}
          image="/team/charly.jpg"
          url={site.author.url}
        >
          Creator of qino
        </Byline>
      </div>
    </Section>
  );
}
