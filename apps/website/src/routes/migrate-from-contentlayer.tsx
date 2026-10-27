import { createFileRoute, redirect } from "@tanstack/react-router";

import { parseMigrationSearch } from "@/lib/parse-migration-search";

// Old URL, kept so outreach links with `?repo=` still land on the page.
export const Route = createFileRoute("/migrate-from-contentlayer")({
  validateSearch: parseMigrationSearch,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/contentlayer-exit", search, statusCode: 301 });
  },
});
