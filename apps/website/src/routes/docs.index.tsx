import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { getDocsTree } from "../server/get-docs-tree";

export const Route = createFileRoute("/docs/")({
  beforeLoad: async () => {
    const [first] = await getDocsTree();
    if (!first) throw notFound();
    throw redirect({ to: "/docs/$", params: { _splat: first.slug } });
  },
});
