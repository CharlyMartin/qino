import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "../components/marketing/site-footer";
import { SiteHeader } from "../components/marketing/site-header";
import { SkipLink } from "../components/marketing/skip-link";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader />
      <main
        id="main-content"
        className="w-full flex-1 px-4 py-12 md:px-7 md:py-16"
      >
        <Outlet />
      </main>
      <div className="border-t">
        <SiteFooter />
      </div>
    </div>
  );
}
