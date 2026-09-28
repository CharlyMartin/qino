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
          title="Many entries, one schema"
          notes={
            <>
              getEntries()
              <br />
              getEntry(slug) · getAllSlugs()
            </>
          }
        >
          A flat folder of similarly shaped entries such as{" "}
          <InlineCode>posts/*.md</InlineCode>. Views filter, sort and paginate.
        </SpecRow>
        <SpecRow
          label="Tree"
          title="Hierarchy and order, first-class"
          notes={
            <>
              getTree() · getFlatTree()
              <br />
              getEntry(slug) · getNextNode()
            </>
          }
        >
          Nested folders with anchor files and{" "}
          <InlineCode>_order.json</InlineCode>. Build a sidebar without
          validating a single body.
        </SpecRow>
        <SpecRow
          label="Item"
          title="One file with its own role"
          notes={
            <>
              getEntry()
              <br />
              view({"{ resolveRelations }"})
            </>
          }
        >
          A single well-known file such as{" "}
          <InlineCode>pages/home.md</InlineCode> — not a one-entry collection.
        </SpecRow>
      </SpecTable>
    </Section>
  );
}
