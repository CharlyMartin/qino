import { ScrollArea } from "@base-ui/react/scroll-area";
import {
  createFileRoute,
  Outlet,
  useMatch,
  useParams,
} from "@tanstack/react-router";

import { DocsMobileNav } from "../components/docs/docs-mobile-nav";
import { DocsSidebar } from "../components/docs/docs-sidebar";
import { SiteFooter } from "../components/marketing/site-footer";
import { SiteHeader } from "../components/marketing/site-header";
import { SkipLink } from "../components/marketing/skip-link";
import { getDocsTree } from "../server/get-docs-tree";
import type { SiteBreadcrumb } from "../types/site-breadcrumb";

export const Route = createFileRoute("/docs")({
  loader: () => getDocsTree(),
  component: DocsLayout,
});

function DocsLayout() {
  const nodes = Route.useLoaderData();
  const { _splat: activeSlug } = useParams({ strict: false });
  // No page on the index, and no loader data on a page that isn't found.
  const page = useMatch({ from: "/docs/$", shouldThrow: false });
  const breadcrumbs: Array<SiteBreadcrumb> = page
    ? [
        { title: "Docs", link: { to: "/docs" } },
        ...(page.loaderData?.breadcrumbs ?? []).map<SiteBreadcrumb>(
          ({ slug, title }) => ({
            title,
            // The trail ends with the page itself, which isn't a link.
            link:
              slug == page.loaderData?.slug
                ? undefined
                : { to: "/docs/$", params: { _splat: slug } },
          }),
        ),
      ]
    : [{ title: "Docs" }];

  return (
    <>
      <SkipLink />
      <div className="sticky top-0 z-30 bg-background">
        <SiteHeader breadcrumbs={breadcrumbs} fullWidth />
      </div>
      {/* Spans the screen: the sidebar sits on its left edge, and pages center
          their content in what's left. */}
      <div className="flex w-full flex-col gap-8 px-4 py-8 md:flex-row md:gap-12 md:px-7 md:py-0 lg:px-12">
        <div className="md:hidden">
          <DocsMobileNav nodes={nodes} activeSlug={activeSlug} />
        </div>
        <aside className="hidden md:sticky md:top-14 md:block md:h-[calc(100dvh-3.5rem)] md:w-60 md:shrink-0 md:self-start md:border-r md:border-sidebar-border">
          <ScrollArea.Root className="h-full">
            <ScrollArea.Viewport
              data-scroll-restoration-id="docs-sidebar"
              aria-label="Documentation sidebar"
              className="h-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:overscroll-contain"
            >
              <ScrollArea.Content className="md:py-16 md:pr-4">
                <DocsSidebar nodes={nodes} activeSlug={activeSlug} />
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className="m-0.5 hidden w-2.5 touch-none select-none rounded-full p-0.5 md:flex">
              <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border-strong hover:bg-muted-foreground" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </aside>
        <main id="main-content" className="min-w-0 flex-1 md:py-16">
          <Outlet />
        </main>
      </div>
      <div className="border-t">
        <SiteFooter fullWidth />
      </div>
    </>
  );
}
