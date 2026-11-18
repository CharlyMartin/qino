import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";

import { SiteFooter } from "../components/marketing/site-footer";
import { SiteHeader } from "../components/marketing/site-header";
import { SkipLink } from "../components/marketing/skip-link";
import type { SiteBreadcrumb } from "../types/site-breadcrumb";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});

function BlogLayout() {
  const post = useMatch({ from: "/blog/$slug", shouldThrow: false });
  // Under a post, even one that isn't found, the blog links back to the index.
  const breadcrumbs: Array<SiteBreadcrumb> = post
    ? [
        { title: "Blog", link: { to: "/blog" } },
        ...(post.loaderData ? [{ title: post.loaderData.title }] : []),
      ]
    : [{ title: "Blog" }];

  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <SiteHeader breadcrumbs={breadcrumbs} />
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
