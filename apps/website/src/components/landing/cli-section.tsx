import { InlineCode } from "./inline-code";
import { Section } from "./section";
import { SpecRow } from "./spec-row";
import { SpecTable } from "./spec-table";
import { Text } from "./text";
import { Title } from "./title";

export function CliSection() {
  return (
    <Section aria-labelledby="cli-heading">
      <div className="max-w-2xl">
        <Title id="cli-heading">
          One command between your content and a broken build.
        </Title>
      </div>
      <div className="mt-4 max-w-xl">
        <Text>
          The CLI runs before your framework does, so content errors surface in
          the terminal instead of at request time.
        </Text>
      </div>
      <SpecTable>
        <SpecRow command label="qino build" title="Generate types">
          Checks every definition, validates every content file against its
          schema, and writes <InlineCode>qino/_generated/types.d.ts</InlineCode>
          . Add it to your prebuild script in{" "}
          <InlineCode>package.json</InlineCode> and every deploy is gated on
          valid content.
        </SpecRow>
        <SpecRow command label="qino check" title="Validate content only">
          Fast feedback in CI or on save. Relation fields are treated as
          ordinary strings and are not followed.
        </SpecRow>
        <SpecRow command label="qino lint" title="Validate definitions only">
          Checks that content and media folders exist, that no two primitives
          own overlapping paths, and that relations target the same instance.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
