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
        <SpecRow
          command
          label="qino build"
          title="Lint, validate, generate"
          notes={
            <>
              run it in prebuild
              <br />
              exits non-zero on failure
            </>
          }
        >
          Checks every definition, validates every content file against its
          schema, and writes <InlineCode>qino/_generated/types.d.ts</InlineCode>
          .
        </SpecRow>
        <SpecRow
          command
          label="qino check"
          title="Validate content only"
          notes={
            <>
              no type generation
              <br />
              no file reads on targets
            </>
          }
        >
          Fast feedback in CI or on save. Relation fields are treated as
          ordinary strings and are not followed.
        </SpecRow>
        <SpecRow
          command
          label="prebuild hook"
          title="Wire it in once"
          notes={
            <>
              gitignore _generated/
              <br />
              works with any framework
            </>
          }
        >
          Add <InlineCode>"prebuild": "qino build"</InlineCode> to{" "}
          <InlineCode>package.json</InlineCode> and every deploy is gated on
          valid content.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
