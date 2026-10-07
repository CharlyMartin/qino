import { ArrowRightIcon } from "@phosphor-icons/react/ssr";

import { ButtonLink } from "./button-link";
import { CodeBlock, type Snippet } from "./code-block";
import { Eyebrow } from "./eyebrow";
import { Section } from "./section";
import { Text } from "./text";
import { Title } from "./title";

type RelationsSectionProps = {
  snippet: Snippet;
};

export function RelationsSection({ snippet }: RelationsSectionProps) {
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
              decides how many hops resolve, up to 6.
            </Text>
          </div>
        </div>
        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <CodeBlock filename="qino/posts.ts" snippet={snippet} />
        </div>
        <dl className="divide-y border-t font-mono text-xs text-foreground-3 lg:col-start-1 lg:mt-7">
          {[
            ["posts.author", "authors"],
            ["posts.categories[*]", "categories"],
            ["posts.tags[*]", "tags"],
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
              When a view resolves a relation, Qino checks that the linked entry
              exists. If it doesn't, the build fails, so broken links never
              ship.
            </Text>
          </div>
        </div>
        <div className="shrink-0 self-start lg:self-center">
          <ButtonLink
            to="/docs/$"
            params={{ _splat: "concepts/relations" }}
            variant="ghost"
            size="inline"
          >
            Read more about relations
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
