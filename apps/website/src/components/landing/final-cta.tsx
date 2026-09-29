
import { ButtonLink } from "./button-link";
import { ExternalLink } from "./external-link";
import { InstallBox } from "./install-box";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

export function FinalCta() {
  return (
    <Section aria-labelledby="cta-heading" spacing="cta" align="center">
      <Title id="cta-heading" size="heading-lg">
        Ready to try qino?
      </Title>
      <div className="mt-5 max-w-lg md:mx-auto">
        <Text>
          Node 22 or newer, a{" "}
          <ExternalLink href="https://standardschema.dev/schema#what-schema-libraries-implement-the-spec">
            Standard Schema validator
          </ExternalLink>
          , and the folder of Markdown you already have.
        </Text>
      </div>
      <div className="mt-8 max-w-lg md:mx-auto">
        <InstallBox withBuild />
      </div>
      <div className="mt-7 flex flex-col gap-3 md:flex-row md:justify-center">
        <ButtonLink to="/docs">
          Read the docs
        </ButtonLink>
        <ButtonLink
          to="/docs/$"
          params={{ _splat: "examples/next-js" }}
          variant="outline"
        >
          See examples
        </ButtonLink>
      </div>
    </Section>
  );
}
