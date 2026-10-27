import { ExternalButtonLink } from "@/components/landing/external-button-link";
import { externalLinks } from "@/lib/external-links";

export function QuoteButton() {
  return (
    <ExternalButtonLink href={externalLinks.contentlayerQuote}>
      Get my fixed quote in 48 hours
    </ExternalButtonLink>
  );
}
