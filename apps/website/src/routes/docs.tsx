import { ScrollArea } from "@base-ui/react/scroll-area";
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";

import { DocsMobileNav } from "../components/docs/docs-mobile-nav";
import { DocsSidebar } from "../components/docs/docs-sidebar";
import { SiteFooter } from "../components/landing/site-footer";
import { SiteHeader } from "../components/landing/site-header";
import { getDocsTree } from "../server/get-docs-tree";

export const Route = createFileRoute("/docs")({
  loader: () => getDocsTree(),
  component: DocsLayout,
});

function DocsLayout() {
  const nodes = Route.useLoaderData();
  const { _splat: activeSlug } = useParams({ strict: false });

  return (
    <>
      <a
        href="#docs-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row md:gap-12 md:px-7 md:py-16 lg:px-12">
        <div className="md:hidden">
          <DocsMobileNav nodes={nodes} activeSlug={activeSlug} />
        </div>
        <aside className="hidden md:sticky md:top-8 md:block md:w-60 md:shrink-0 md:self-start">
          <ScrollArea.Root>
            <ScrollArea.Viewport
              data-scroll-restoration-id="docs-sidebar"
              aria-label="Documentation sidebar"
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:max-h-[calc(100dvh-4rem)] md:overscroll-contain"
            >
              <ScrollArea.Content className="md:pr-4">
                <DocsSidebar nodes={nodes} activeSlug={activeSlug} />
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="m-0.5 hidden w-2.5 touch-none select-none rounded-full p-0.5 md:flex">
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border-strong hover:bg-muted-foreground" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </aside>
        <main id="docs-content" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
