import { version } from "../../../../../packages/cms/package.json";
import { ButtonLink } from "./button-link";
import { Eyebrow } from "./eyebrow";
import { InstallBox } from "./install-box";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

export function Hero() {
  return (
    <Section aria-labelledby="hero-heading" spacing="hero" align="center">
      <Eyebrow tone="accent">
        Headless flat-file CMS{" "}
        <span className="text-muted-foreground normal-case">
          · v{version.split(".").slice(0, 2).join(".")}
        </span>
      </Eyebrow>

      <div className="space-y-8 mt-4 mb-20">
        <div className="max-w-3xl md:mx-auto">
          <Title as="h1" size="display" id="hero-heading">
            Markdown in.
            <br />
            TypeScript out.
          </Title>
        </div>

        <div className="max-w-xl md:mx-auto text-balance">
          <Text size="lead">
            Point qino at a content folder, hand it a schema, and you're
            laughing! You can now query your file system like an API, nothing to
            deploy.
          </Text>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:justify-center">
          <ButtonLink to="/docs">Read the docs</ButtonLink>
          <ButtonLink
            to="/docs/$"
            params={{ _splat: "examples" }}
            variant="outline"
          >
            See examples
          </ButtonLink>
        </div>
      </div>

      <div className="max-w-md md:mx-auto">
        <InstallBox />
      </div>
    </Section>
  );
}
