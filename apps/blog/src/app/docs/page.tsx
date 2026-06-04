import Link from "next/link";

import { docsTree } from "../../../qino/trees/docs";
import { DocsSidebar } from "./docs-sidebar";

export default async function DocsIndex() {
  const nodes = await docsTree.getTree();

  return (
    <main className="mx-auto flex w-full max-w-5xl gap-12 px-6 py-16">
      <aside className="w-60 shrink-0">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Docs
        </h2>
        <DocsSidebar nodes={nodes} />
      </aside>
      <article className="flex-1">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-zinc-500 hover:underline dark:text-zinc-400"
        >
          {"< Home"}
        </Link>
        <h1 className="mb-4 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Documentation
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          Pick a page from the sidebar to get started.
        </p>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Raw tree (NodeTree[])
          </h2>
          <pre className="overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {JSON.stringify(
              nodes,
              (key, value) =>
                key == "filePath" && typeof value == "string"
                  ? value.replace(process.cwd(), "")
                  : value,
              2,
            )}
          </pre>
        </section>
      </article>
    </main>
  );
}
