import { CodeBlock } from "./code-block";
import { CodeToken as Token } from "./code-token";
import { Eyebrow } from "./eyebrow";

export function Pipeline() {
  return (
    <section aria-labelledby="pipeline-heading" className="border-b">
      <h2 id="pipeline-heading" className="sr-only">
        From content files to typed entries
      </h2>
      <div className="mx-auto grid max-w-7xl md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 border-b px-4 py-8 md:border-r md:border-b-0 md:px-7 lg:px-8">
          <Eyebrow>01 — Markdown on disk</Eyebrow>
          <div className="mt-5 space-y-2 font-mono text-xs leading-relaxed text-foreground-2">
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

        <div className="min-w-0 bg-surface/50 px-4 py-8 md:px-7 lg:border-r lg:px-8">
          <Eyebrow tone="accent">02 — Qino</Eyebrow>
          <div className="mt-4">
            <CodeBlock aria-label="Define an articles collection">
              <Token kind="kw">const</Token>
              {" postsCollection = qino."}
              <Token kind="fn">defineCollection</Token>
              {"({\n  directory: "}
              <Token kind="string">{'"/posts"'}</Token>
              {",\n  extension: "}
              <Token kind="string">{'".md"'}</Token>
              {
                ",\n  schema: PostSchema,\n  relations: {\n    author: authorsCollection,\n  },\n  views: (view) => ({\n    default: view({ resolveRelations: "
              }
              <Token kind="string">1</Token>
              {" }),\n  }),\n})"}
            </CodeBlock>
          </div>
        </div>

        <div className="min-w-0 border-t px-4 py-8 md:col-span-2 md:px-7 lg:col-span-1 lg:border-t-0 lg:px-8">
          <Eyebrow>03 — In your app</Eyebrow>
          <div className="mt-5">
            <CodeBlock aria-label="Read the articles">
              <Token kind="kw">await</Token>
              {" postsCollection."}
              <Token kind="fn">getEntries</Token>
              {"()"}
            </CodeBlock>
          </div>
          <div className="mt-4">
            <CodeBlock
              variant="result"
              aria-label="Typed entries with resolved authors"
            >
              {"[\n  {\n    title: "}
              <Token kind="string">{'"Hello world"'}</Token>
              {",\n    author: { name: "}
              <Token kind="string">{'"Camille Laurent"'}</Token>
              {" },\n    _meta: { slug: "}
              <Token kind="string">{'"hello-world"'}</Token>
              {" },\n  },\n  {\n    title: "}
              <Token kind="string">{'"Typed content"'}</Token>
              {",\n    author: { name: "}
              <Token kind="string">{'"Jonas Weiss"'}</Token>
              {" },\n    _meta: { slug: "}
              <Token kind="string">{'"typed-content"'}</Token>
              {" },\n  },\n]"}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}
