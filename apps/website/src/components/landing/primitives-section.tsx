import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

import { ButtonLink } from "./button-link";
import { InlineCode } from "./inline-code";
import { Section } from "./section";
import { SpecRow } from "./spec-row";
import { SpecTable } from "./spec-table";
import { Title } from "./title";

export function PrimitivesSection() {
  return (
    <Section aria-labelledby="primitives-heading">
      <div className="max-w-2xl">
        <Title id="primitives-heading">Three ways to model content</Title>
      </div>
      <SpecTable>
        <SpecRow
          label="Collection"
          title="Unordered list of of entries"
          notes={
            <ButtonLink
              to="/docs/$"
              params={{ _splat: "concepts/collections" }}
              variant="ghost"
              size="inline"
            >
              Read more about collections
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        >
          A flat folder of similarly shaped entries such as{" "}
          <InlineCode>posts/*.md</InlineCode>. Great for blog posts, events,
          team members, etc. Views filter, sort and paginate.
        </SpecRow>
        <SpecRow
          label="Tree"
          title="Hierarchy and order, first-class"
          notes={
            <ButtonLink
              to="/docs/$"
              params={{ _splat: "concepts/trees" }}
              variant="ghost"
              size="inline"
            >
              Read more about trees
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        >
          Nested folders with anchor files and{" "}
          <InlineCode>_order.json</InlineCode>. Great for docs, guides or a
          knowlegde base. Build a sidebar without validating a single body.
        </SpecRow>
        <SpecRow
          label="Item"
          title="One file with its own role"
          notes={
            <ButtonLink
              to="/docs/$"
              params={{ _splat: "concepts/items" }}
              variant="ghost"
              size="inline"
            >
              Read more about items
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        >
          A single file, such as <InlineCode>pages/home.md</InlineCode>, with a
          unique schema. Great for pages or navigation.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
