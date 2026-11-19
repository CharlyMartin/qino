# qino links to pages but never routes to them

To serve agent Markdown, a consumer's entry page route asks qino for it, passing the slug it already has. qino doesn't map a request path back to an entry. The URL patterns that primitives declare are used only to build links: in `llms.txt`, in index listings, and for the Markdown URLs pages advertise. We chose this so that a pattern drifting from the real routes breaks links, not negotiation. An entry that has no page, because its slug is unknown or the view excludes it (a draft, for example), has no agent Markdown either: qino answers with a Markdown 404, whichever handler runs first.

## Consequences

On a prerendered page the route never runs: the host serves the static HTML without calling it. Negotiation there is a host-level rewrite of Markdown requests to the page's Markdown URL. qino documents that rewrite for each host but doesn't generate it, for the same reason it doesn't route.

## Considered Options

- **Path-to-entry lookup from URL patterns**, called from a middleware or proxy. Rejected: it serves Markdown for entries with no page (drafts), it stops negotiating without any error when a route moves, and one pattern can't describe the same entry at several URLs (translations).
