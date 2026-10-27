import { Section } from "@/components/landing/section";
import { Text } from "@/components/landing/text";
import { Title } from "@/components/landing/title";
import { MigrationForm } from "./migration-form";

type StartSectionProps = {
  repo?: string;
};

export function StartSection({ repo }: StartSectionProps) {
  return (
    <Section
      aria-labelledby="start-heading"
      id="start"
      spacing="cta"
      align="center"
    >
      <div className="max-w-4xl text-center mx-auto">
        <Title id="start-heading" size="heading-lg">
          Get Contentlayer out of the way of your next upgrade.
        </Title>
      </div>
      <div className="mt-5 max-w-lg md:mx-auto">
        <Text>
          Once you send your repo details, I'll reply personally with a fixed
          scope and anything I'd flag before we begin.{" "}
          <span className="underline decoration-primary/70 decoration-2 underline-offset-[0.16em]">
            No charges until you approve the scope.
          </span>
        </Text>
      </div>
      <div className="mt-10 max-w-lg md:mx-auto">
        <MigrationForm repo={repo} />
      </div>
    </Section>
  );
}
