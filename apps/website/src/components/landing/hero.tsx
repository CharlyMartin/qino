import type { ProjectStats } from "@/types/project-stats";
import { ButtonLink } from "./button-link";
import { Eyebrow } from "./eyebrow";
import { HeroStats } from "./hero-stats";
import { InstallBox } from "./install-box";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

type HeroProps = {
  stats: ProjectStats;
};

export function Hero({ stats }: HeroProps) {
  return (
    <Section aria-labelledby="hero-heading" spacing="hero" align="center">
      <Eyebrow tone="accent">Headless flat-file CMS</Eyebrow>
      <div className="mt-4">
        <HeroStats stats={stats} />
      </div>

      <div className="space-y-8 mt-8 mb-28">
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
