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
      <aside className="md:w-60 md:shrink-0">
        <Link
          to="/"
          className="mb-6 inline-block text-lg font-semibold tracking-tight"
        >
          Qino
        </Link>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Docs
        </h2>
        <DocsSidebar nodes={nodes} activeSlug={activeSlug} />
      </aside>
      <main id="docs-content" className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
