import { CodeBlock, type Snippet } from "./code-block";
import { Eyebrow } from "./eyebrow";

type PipelineProps = {
  define: Snippet;
  query: Snippet;
};

export function Pipeline({ define, query }: PipelineProps) {
  return (
    <section aria-labelledby="pipeline-heading" className="border-b">
      <h2 id="pipeline-heading" className="sr-only">
        From content files to typed entries
      </h2>
      <div className="mx-auto grid max-w-7xl md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 border-b px-4 py-8 md:border-r md:border-b-0 md:px-7 lg:px-8 space-y-6">
          <Eyebrow>01 — Markdown on disk</Eyebrow>
          <div className="space-y-2 font-mono text-xs leading-relaxed text-foreground-2">
            <p className="text-muted-foreground">src/content/posts/</p>
            <ul className="space-y-2 pl-3.5">
              <li>hello-world.md</li>
              <li>typed-content.md</li>
            </ul>
            <p className="pt-2 text-muted-foreground">src/content/authors/</p>
            <ul className="space-y-2 pl-3.5">
              <li>camille-laurent.json</li>
              <li>jonas-weiss.json</li>
            </ul>
          </div>
        </div>

        <div className="min-w-0 bg-surface/50 px-4 py-8 md:px-7 lg:border-r lg:px-8 space-y-6">
          <Eyebrow tone="accent">02 — Qino</Eyebrow>
          <CodeBlock snippet={define} />
        </div>

        <div className="min-w-0 border-t px-4 py-8 md:col-span-2 md:px-7 lg:col-span-1 lg:border-t-0 lg:px-8 space-y-6">
          <Eyebrow>03 — In your app</Eyebrow>
          <CodeBlock snippet={query} />
        </div>
      </div>
    </section>
  );
}
