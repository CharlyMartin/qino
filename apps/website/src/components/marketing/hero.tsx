import type { ProjectStats } from "@/types/project-stats";
import { ButtonLink } from "./button-link";
import { Eyebrow } from "./eyebrow";
import { HeroStats } from "./hero-stats";
import { InstallBox } from "./install-box";
import { InstallPromptDialog } from "./install-prompt-dialog";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";
import { Underline } from "./underline";

type HeroProps = {
  stats: ProjectStats;
};

export function Hero({ stats }: HeroProps) {
  return (
    <Section aria-labelledby="hero-heading" spacing="hero" align="center">
      {/* `site.keywords` leads with "content pipeline" because this shows it. */}
      <Eyebrow tone="accent">Agent-ready content pipeline</Eyebrow>
      <div className="mt-4">
        <HeroStats stats={stats} />
      </div>

      <div className="space-y-8 mt-8 mb-16">
        <div className="max-w-3xl md:mx-auto">
          <Title as="h1" size="display" id="hero-heading">
            Markdown in.
            <br />
            TypeScript out.
          </Title>
        </div>

        <div className="max-w-xl md:mx-auto text-balance">
          <Text size="lead">
            <Underline>You own</Underline> your website's content. qino works
            with it. Nothing to deploy!
          </Text>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:justify-center">
          <InstallPromptDialog />
          <ButtonLink to="/cloud" variant="outline">
            Join the Cloud waitlist
          </ButtonLink>
        </div>
      </div>

      <div className="max-w-md md:mx-auto">
        <InstallBox />
      </div>
    </Section>
  );
}
