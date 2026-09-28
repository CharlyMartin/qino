import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Link } from "@tanstack/react-router";

import { CodeBlock } from "./code-block";
import { CodeToken as Token } from "./code-token";
import { Eyebrow } from "./eyebrow";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

export function RelationsSection() {
  return (
    <Section aria-labelledby="relations-heading">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-x-12 lg:gap-y-0">
        <div>
          <Eyebrow tone="accent">Relations</Eyebrow>
          <div className="mt-4">
            <Title id="relations-heading">
              Qino makes your content a relational database.
            </Title>
          </div>
          <div className="mt-5 max-w-md">
            <Text>
              Declare a relation and a frontmatter string becomes a typed
              foreign key. Any primitive can point at any other; the view
              decides how many hops resolve, up to six.
            </Text>
          </div>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <CodeBlock
            filename="qino/collections/posts.ts"
            aria-label="Declare relations between collections"
          >
            <Token kind="kw">export const</Token>
            {" postCollection = qino."}
            <Token kind="fn">defineCollection</Token>
            {"({\n  directory: "}
            <Token kind="string">{'"/posts"'}</Token>
            {", extension: "}
            <Token kind="string">{'".md"'}</Token>
            {
              ",\n  schema: z.object({\n    title: z.string(), author: z.string(),\n    categories: z.array(z.string()),\n  }),\n  relations: {\n    author: authorCollection,\n    "
            }
            <Token kind="string">{'"categories[*]"'}</Token>
            {
              ": categoryCollection,\n  },\n  views: (view) => ({\n    default: view({}),\n    detail: view({ resolveRelations: "
            }
            <Token kind="string">1</Token>
            {" }),\n  }),\n})"}
          </CodeBlock>
        </div>
        <dl className="divide-y border-t font-mono text-xs text-foreground-3 lg:col-start-1 lg:mt-7">
          {[
            ["posts.author", "authors"],
            ["posts.categories[*]", "categories"],
            ["docs.related", "posts"],
          ].map(([field, target]) => (
            <div
              key={field}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <dt>{field}</dt>
              <dd className="flex items-center gap-2 text-primary">
                <ArrowRightIcon className="size-3" aria-hidden="true" />
                {target}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-10 flex flex-col gap-6 border-t pt-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div>
          <Title as="h3" size="row">
            A broken relation should fail the build, not the page.
          </Title>
          <div className="mt-2 max-w-xl">
            <Text>
              References are followed and validated whenever a resolving view
              reads them, so a bad path never reaches production.
            </Text>
          </div>
        </div>
        <Link
          to="/docs/$"
          params={{ _splat: "concepts/relations" }}
          className="inline-flex shrink-0 items-center gap-1 self-start border-b border-primary-muted pb-1 text-sm font-semibold text-primary hover:text-foreground lg:self-center"
        >
          Read about relations{" "}
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Section>
  );
}
