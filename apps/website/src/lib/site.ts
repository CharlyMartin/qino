const url = "https://www.qino.works";

// `content/llms.md`, the llms.txt template, repeats the URL, description and email.
export const site = {
  url,
  name: "qino",
  description:
    "A type-safe content pipeline for Markdown, MDX and JSON, a lightweight alternative to a flat-file CMS. Query your content with schema validation, resolved relations and inferred TypeScript types. Nothing to deploy.",
  ogImage: "/og.png",
  logo: "/apple-touch-icon.png",
  author: { name: "Charly Martin", url: "https://github.com/CharlyMartin" },
  /** Every page's `publisher` points at the root route's Organization by this id. */
  organizationId: `${url}/#organization`,
  email: "hello@qino.works",
  address: { locality: "Paris", country: "France", countryCode: "FR" },
  // "content pipeline" leads: the hero's eyebrow shows it, and is-agentic asks
  // for keywords the page shows (docs/agents/agent-readiness-scanners.md).
  keywords: [
    "content pipeline",
    "Markdown CMS",
    "headless CMS",
    "flat-file CMS",
    "Git-based CMS",
    "MDX",
    "TypeScript",
    "Standard Schema",
  ],
} as const;
