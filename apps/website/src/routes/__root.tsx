import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { ReactNode } from "react";

import { PageError } from "../components/page-error";
import { PageNotFound } from "../components/page-not-found";
import satoshi from "../fonts/satoshi-variable.woff2?url";
import splineSansMono from "../fonts/spline-sans-mono-variable.woff2?url";
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Qino" },
    ],
    links: [
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
