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
      <Title id="start-heading" size="heading-lg">
        Get unblocked this week
      </Title>
      <div className="mt-5 max-w-lg md:mx-auto">
        <Text>
          Once you send your repo details, I'll reply personally with a fixed
          scope and anything I'd flag before we begin. No charges until you
          approve the scope.
        </Text>
      </div>
      <div className="mt-10 max-w-lg md:mx-auto">
        <MigrationForm repo={repo} />
      </div>
    </Section>
  );
}
