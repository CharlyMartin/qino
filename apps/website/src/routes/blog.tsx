import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "../components/landing/site-footer";
import { SiteHeader } from "../components/landing/site-header";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#blog-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main
        id="blog-content"
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
