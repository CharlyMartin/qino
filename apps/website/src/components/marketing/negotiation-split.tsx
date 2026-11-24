import { cn } from "@/lib/cn";
import { Eyebrow } from "./eyebrow";

type Exchange = {
  client: string;
  type: string;
  body: string;
  accent: boolean;
};

const path = "/docs/concepts/relations";

// Real responses from www.qino.works, cut down to the headers negotiation sets.
const exchanges: Exchange[] = [
  {
    client: "Browser",
    type: "text/html",
    body: '<!DOCTYPE html><html lang="en" class="dark">…',
    accent: false,
  },
  {
    client: "Agent",
    type: "text/markdown",
    body: [
      "---",
      'title: "Relations"',
      'description: "Typed references between entries and how they resolve."',
      'canonical: "https://www.qino.works/docs/concepts/relations"',
      "---",
      "",
      "# Relations",
      "",
      "> Typed references between entries and how they resolve.",
    ].join("\n"),
    accent: true,
  },
];

export function NegotiationSplit() {
  return (
    <div className="grid overflow-hidden rounded-sm border bg-surface/50 font-mono text-code md:grid-cols-2 md:divide-x">
      {exchanges.map(({ client, type, body, accent }) => (
        <div
          key={client}
          className="min-w-0 border-b p-4 last:border-b-0 md:border-b-0 md:p-5"
        >
          <Eyebrow tone={accent ? "accent" : "muted"}>{client}</Eyebrow>
          <pre className="mt-3 whitespace-pre-wrap wrap-break-word text-foreground-2">
            <code>
              <span className="text-muted-foreground">GET</span> {path}
              {"\n"}
              <span className="text-muted-foreground">Accept:</span>{" "}
              <span className={cn(accent && "text-primary")}>{type}</span>
              {"\n\n"}
              <span className="text-muted-foreground">HTTP/2</span> 200
              {"\n"}
              <span className="text-muted-foreground">content-type:</span>{" "}
              <span className={cn(accent && "text-primary")}>{type}</span>
              {"; charset=utf-8\n"}
              <span className="text-muted-foreground">vary:</span> Accept
              {"\n\n"}
              <span className="text-foreground-3">{body}</span>
            </code>
          </pre>
        </div>
      ))}
    </div>
  );
}
