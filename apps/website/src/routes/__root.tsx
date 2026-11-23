import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { ReactNode } from "react";

import { PageError } from "../components/page-error";
import { PageNotFound } from "../components/page-not-found";
import satoshi from "../fonts/satoshi-variable.woff2?url";
import splineSansMono from "../fonts/spline-sans-mono-variable.woff2?url";
import { externalLinks } from "../lib/external-links";
import { site } from "../lib/site";
import { toJsonLdScript } from "../lib/to-json-ld-script";
import appCss from "../styles/app.css?url";

const ogImage = new URL(site.ogImage, site.url).href;
const logo = new URL(site.logo, site.url).href;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: site.name },
      { name: "description", content: site.description },
      { name: "theme-color", content: "#1c1917" },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: ogImage },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: site.logo },
      {
        rel: "preload",
        href: satoshi,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: splineSansMono,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      // `SiteFooter` shows the contact email and address this marks up.
      toJsonLdScript({
        "@type": "Organization",
        "@id": site.organizationId,
        name: site.name,
        url: site.url,
        logo,
        description: site.description,
        founder: { "@type": "Person", ...site.author },
        contactPoint: {
          "@type": "ContactPoint",
          email: site.email,
          contactType: "customer support",
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: site.address.locality,
          addressCountry: site.address.countryCode,
        },
        sameAs: [externalLinks.github, externalLinks.npm],
      }),
      toJsonLdScript({
        "@type": "WebSite",
        name: site.name,
        url: site.url,
        description: site.description,
        keywords: site.keywords.join(", "),
        publisher: { "@id": site.organizationId },
      }),
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

type RootDocumentProps = {
  children: ReactNode;
};

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Scripts />
      </body>
    </html>
  );
}
