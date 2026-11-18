import { cn } from "../../lib/cn";
import { ExternalLink } from "./external-link";

type SiteFooterProps = {
  /** Spans the screen, as the docs do, instead of the centered column. */
  fullWidth?: boolean;
};

export function SiteFooter({ fullWidth }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "mx-auto flex w-full flex-col gap-3 px-4 py-5 font-mono text-xs leading-relaxed text-muted-foreground md:flex-row md:justify-between md:px-7 lg:px-12",
        !fullWidth && "max-w-7xl",
      )}
    >
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
