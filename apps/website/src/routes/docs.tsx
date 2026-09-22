import { ScrollArea } from "@base-ui/react/scroll-area";
import {
  createFileRoute,
  Link,
  Outlet,
  useParams,
} from "@tanstack/react-router";

import { DocsSidebar } from "../components/docs/docs-sidebar";
import { getDocsTree } from "../server/get-docs-tree";

export const Route = createFileRoute("/docs")({
  loader: () => getDocsTree(),
  component: DocsLayout,
});

function DocsLayout() {
  const nodes = Route.useLoaderData();
  const { _splat: activeSlug } = useParams({ strict: false });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:gap-12 md:py-16">
      <a href="#docs-content" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <aside className="md:sticky md:top-16 md:w-60 md:shrink-0 md:self-start">
        <ScrollArea.Root>
          <ScrollArea.Viewport
            data-scroll-restoration-id="docs-sidebar"
            aria-label="Documentation sidebar"
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:max-h-[calc(100dvh-8rem)] md:overscroll-contain"
          >
            <ScrollArea.Content className="md:pr-4">
              <Link
                to="/"
                className="mb-6 inline-block text-lg font-semibold tracking-tight"
              >
                Qino
              </Link>
              <DocsSidebar nodes={nodes} activeSlug={activeSlug} />
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="m-0.5 hidden w-2.5 touch-none select-none rounded-full p-0.5 md:flex">
            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </aside>
      <main id="docs-content" className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
