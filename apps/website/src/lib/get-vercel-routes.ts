type VercelHasField = {
  type: "header";
  key: string;
  value: string;
};

type VercelRoute = {
  src: string;
  dest?: string;
  methods?: Array<string>;
  has?: Array<VercelHasField>;
  headers?: Record<string, string>;
  continue?: boolean;
};

// The homepage and docs pages, not files such as `/docs/<slug>.md`.
const markdownPages = "^/(?:docs(?:/[^/.]+)*/?)?$";

// Media types are case-insensitive: "text/markdown" as "[Tt][Ee][Xx][Tt]/[Mm]…".
const markdownType = "text/markdown".replace(
  /[a-z]/g,
  (letter) => `[${letter.toUpperCase()}${letter}]`,
);

// Vercel serves prerendered pages before the server runs, so Markdown requests for
// them go to Nitro's catch-all function, which negotiates them (src/start.ts).
export function getVercelRoutes() {
  const routes: Array<VercelRoute> = [
    {
      src: markdownPages,
      headers: { Vary: "Accept, Accept-Encoding" },
      continue: true,
    },
    {
      src: markdownPages,
      methods: ["GET", "HEAD"],
      has: [{ type: "header", key: "accept", value: `.*${markdownType}.*` }],
      dest: "/__server",
    },
  ];
  return routes;
}
