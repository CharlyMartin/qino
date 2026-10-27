import { CodeBlock, type Snippet } from "./code-block";
import { Eyebrow } from "./eyebrow";
import { Section } from "./section";
import { SectionHeading } from "./section-heading";

type PipelineProps = {
  files: Snippet;
  define: Snippet;
  query: Snippet;
};

export function Pipeline({ files, define, query }: PipelineProps) {
  return (
    <Section aria-labelledby="pipeline-heading" spacing="none" bleed>
      <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-7 md:py-14 lg:px-8">
          <SectionHeading
            id="pipeline-heading"
            title="qino is dead simple to set up"
          >
            qino works with what you already have: Markdown files in your repo,
            a TypeScript config, and your framework of choice.
          </SectionHeading>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 border-b px-4 py-8 md:border-r md:border-b-0 md:px-7 lg:px-8 space-y-6">
          <Eyebrow>01 — Markdown on disk</Eyebrow>
          <CodeBlock snippet={files} />
        </div>

        <div className="min-w-0 bg-surface/50 px-4 py-8 md:px-7 lg:border-r lg:px-8 space-y-6">
          <Eyebrow tone="accent">02 — qino</Eyebrow>
          <CodeBlock snippet={define} />
        </div>

        <div className="min-w-0 border-t px-4 py-8 md:col-span-2 md:px-7 lg:col-span-1 lg:border-t-0 lg:px-8 space-y-6">
          <Eyebrow>03 — In your app</Eyebrow>
          <CodeBlock snippet={query} />
        </div>
      </div>
    </Section>
  );
}
