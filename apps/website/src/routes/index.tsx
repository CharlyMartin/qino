import { createFileRoute } from "@tanstack/react-router";

import { AgentSection } from "@/components/landing/agent-section";
import { CliSection } from "@/components/landing/cli-section";
import { FileTypes } from "@/components/landing/file-types";
import { Hero } from "@/components/landing/hero";
import { Pipeline } from "@/components/landing/pipeline";
import { PrimitivesSection } from "@/components/landing/primitives-section";
import { RelationsSection } from "@/components/landing/relations-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Qino — Markdown in. TypeScript out." },
      {
        name: "description",
        content:
          "A headless flat-file CMS for Markdown, MDX and JSON. Query your content with schema validation, resolved relations and inferred TypeScript types. Nothing to deploy.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Pipeline />
        <FileTypes />
        <PrimitivesSection />
        <RelationsSection />
        <CliSection />
        <AgentSection />
      </main>
      <SiteFooter />
    </>
  );
}
