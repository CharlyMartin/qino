import { ExternalLink } from "./external-link";

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 font-mono text-xs leading-relaxed text-muted-foreground md:flex-row md:justify-between md:px-7 lg:px-12">
      <p>qino — MIT licensed</p>
      <p>
        Node 22+ · TypeScript 5.9+ ·{" "}
        <ExternalLink href="https://standardschema.dev/">
          Standard Schema
        </ExternalLink>
      </p>
    </footer>
  );
}
