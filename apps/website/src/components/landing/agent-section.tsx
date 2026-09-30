import { ArrowUpRightIcon } from "@phosphor-icons/react/ssr";

import { ExternalButtonLink } from "./external-button-link";
import { InlineCode } from "./inline-code";
import { InstallBox } from "./install-box";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

export function AgentSection() {
  return (
    <Section aria-labelledby="agent-heading" spacing="cta" align="center">
      <Title id="agent-heading" size="heading-lg">
        Let your agent set it up.
      </Title>
      <div className="mt-5 max-w-lg md:mx-auto">
        <Text>
          Install the qino skill, then ask your coding agent to add qino. It
          models the content you already have into collections, trees, and
          items, infers schemas, wires <InlineCode>qino{" "}build</InlineCode>{" "}
          into your build, and keeps going until it passes.
        </Text>
      </div>
      <div className="mt-8 max-w-xl md:mx-auto">
        <InstallBox command={["install", "skill"]} />
      </div>
      <div className="mt-7 flex flex-col gap-3 md:flex-row md:justify-center">
        <ExternalButtonLink
          href="https://github.com/CharlyMartin/qino/tree/main/skills/set-up-qino-cms"
          variant="outline"
        >
          View the skill on GitHub
          <ArrowUpRightIcon className="size-4" aria-hidden="true" />
        </ExternalButtonLink>
      </div>
    </Section>
  );
}
